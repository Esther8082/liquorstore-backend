
const Database = require("better-sqlite3");
const { app } = require("electron");
const path = require("path");
const fs = require("fs");

let db;

// =========================================================
// INITIALIZE DATABASE
// =========================================================

function initializeDatabase() {
    if (db) return db;

    const dataDirectory = app.getPath("userData");
    fs.mkdirSync(dataDirectory, { recursive: true });

    const databasePath = path.join(
        dataDirectory,
        "liquor-store-pos.db"
    );

    db = new Database(databasePath);

    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    db.exec(`
        CREATE TABLE IF NOT EXISTS products (
            product_id INTEGER PRIMARY KEY,
            barcode TEXT,
            item_name TEXT NOT NULL,
            item_size TEXT,
            price REAL NOT NULL DEFAULT 0,
            quantity_in_stock INTEGER NOT NULL DEFAULT 0,
            image_url TEXT,
            category_name TEXT,
            category_id INTEGER,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
            category_id INTEGER PRIMARY KEY,
            category_name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS customers (
            customer_id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            phone_number TEXT,
            email TEXT,
            customer_type TEXT NOT NULL DEFAULT 'Cash',
            sync_status TEXT NOT NULL DEFAULT 'synced'
        );

        CREATE TABLE IF NOT EXISTS customer_sync_queue (
            queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            operation TEXT NOT NULL,
            payload TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS product_sync_queue (
            queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            operation TEXT NOT NULL,
            payload TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS local_sales (
            local_sale_id TEXT PRIMARY KEY,
            server_sale_id INTEGER,
            receipt_number TEXT,
            customer_id INTEGER,
            payment_method TEXT NOT NULL,
            subtotal REAL NOT NULL,
            total REAL NOT NULL,
            cash_amount REAL NOT NULL DEFAULT 0,
            card_amount REAL NOT NULL DEFAULT 0,
            amount_paid REAL NOT NULL DEFAULT 0,
            change_given REAL NOT NULL DEFAULT 0,
            sync_status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS local_sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            local_sale_id TEXT NOT NULL,
            product_id INTEGER NOT NULL,
            item_name TEXT,
            quantity INTEGER NOT NULL,
            selling_price REAL NOT NULL,
            line_total REAL NOT NULL,
            FOREIGN KEY (local_sale_id)
                REFERENCES local_sales(local_sale_id)
                ON DELETE CASCADE
        );
    `);

    // =====================================================
    // DATABASE MIGRATIONS
    // Preserve existing records when adding new columns.
    // =====================================================

    const customerColumns = db
        .prepare("PRAGMA table_info(customers)")
        .all()
        .map(column => column.name);

    if (!customerColumns.includes("email")) {
        db.exec("ALTER TABLE customers ADD COLUMN email TEXT");
    }

    if (!customerColumns.includes("customer_type")) {
        db.exec(`
            ALTER TABLE customers
            ADD COLUMN customer_type TEXT NOT NULL DEFAULT 'Cash'
        `);
    }

    if (!customerColumns.includes("sync_status")) {
        db.exec(`
            ALTER TABLE customers
            ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'synced'
        `);
    }

    const productColumns = db
        .prepare("PRAGMA table_info(products)")
        .all()
        .map(column => column.name);

    if (!productColumns.includes("category_id")) {
        db.exec("ALTER TABLE products ADD COLUMN category_id INTEGER");
    }

    // Populate category IDs for existing cached products where possible.
    db.exec(`
        UPDATE products
        SET category_id = (
            SELECT categories.category_id
            FROM categories
            WHERE categories.category_name = products.category_name
        )
        WHERE category_id IS NULL
    `);

    console.log("Local database initialized.");
    console.log("Database location:", databasePath);

    return db;
}

// =========================================================
// PRODUCTS: READ LOCAL CACHE
// =========================================================

function getCachedProducts() {
    return initializeDatabase().prepare(`
        SELECT
            product_id,
            barcode,
            item_name,
            item_size,
            price,
            quantity_in_stock,
            image_url,
            category_name,
            category_id
        FROM products
        ORDER BY item_name ASC
    `).all();
}

// =========================================================
// PRODUCTS: SAVE SERVER PRODUCTS TO LOCAL CACHE
// =========================================================

function saveCachedProducts(products) {
    if (!Array.isArray(products)) {
        throw new Error("Products must be an array.");
    }

    const database = initializeDatabase();

    const saveTransaction = database.transaction(items => {
        const saveProduct = database.prepare(`
            INSERT INTO products (
                product_id,
                barcode,
                item_name,
                item_size,
                price,
                quantity_in_stock,
                image_url,
                category_name,
                category_id,
                updated_at
            )
            VALUES (
                @product_id,
                @barcode,
                @item_name,
                @item_size,
                @price,
                @quantity_in_stock,
                @image_url,
                @category_name,
                @category_id,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT(product_id) DO UPDATE SET
                barcode = excluded.barcode,
                item_name = excluded.item_name,
                item_size = excluded.item_size,
                price = excluded.price,
                quantity_in_stock = excluded.quantity_in_stock,
                image_url = excluded.image_url,
                category_name = excluded.category_name,
                category_id = excluded.category_id,
                updated_at = CURRENT_TIMESTAMP
        `);

        for (const product of items) {
            if (
                product.product_id == null ||
                !product.item_name
            ) {
                throw new Error(
                    "A product is missing its ID or item name."
                );
            }

            saveProduct.run({
                product_id: product.product_id,
                barcode: product.barcode ?? null,
                item_name: product.item_name,
                item_size: product.item_size ?? null,
                price: Number(product.price) || 0,
                quantity_in_stock:
                    Number(product.quantity_in_stock) || 0,
                image_url: product.image_url ?? null,
                category_name: product.category_name ?? null,
                category_id: product.category_id ?? null
            });
        }
    });

    saveTransaction(products);

    return { saved: products.length };
}

// =========================================================
// PRODUCTS: CREATE PRODUCT WHILE OFFLINE
// =========================================================

function createLocalProduct(product) {
    if (!product || !product.item_name?.trim()) {
        throw new Error("Product name is required.");
    }

    if (product.category_id == null) {
        throw new Error("Please select a category.");
    }

    const database = initializeDatabase();

    return database.transaction(() => {
        const lowest = database.prepare(`
            SELECT MIN(product_id) AS lowest_id
            FROM products
            WHERE product_id < 0
        `).get();

        const productId =
            lowest.lowest_id == null ? -1 : lowest.lowest_id - 1;

        const category = database.prepare(`
            SELECT category_name
            FROM categories
            WHERE category_id = ?
        `).get(product.category_id);

        if (!category) {
            throw new Error(
                "This category is not available offline. Connect to the internet and load categories first."
            );
        }

        const newProduct = {
            product_id: productId,
            category_id: Number(product.category_id),
            category_name: category.category_name,
            item_name: product.item_name.trim(),
            item_size: product.item_size || "",
            barcode: product.barcode || null,
            quantity_in_stock: Number(product.quantity_in_stock) || 0,
            price: Number(product.price) || 0,
            image_url: product.image_url || null
        };

        database.prepare(`
            INSERT INTO products (
                product_id,
                barcode,
                item_name,
                item_size,
                price,
                quantity_in_stock,
                image_url,
                category_name,
                category_id
            )
            VALUES (
                @product_id,
                @barcode,
                @item_name,
                @item_size,
                @price,
                @quantity_in_stock,
                @image_url,
                @category_name,
                @category_id
            )
        `).run(newProduct);

        database.prepare(`
            INSERT INTO product_sync_queue (
                product_id,
                operation,
                payload
            )
            VALUES (?, 'create', ?)
        `).run(productId, JSON.stringify(newProduct));

        return newProduct;
    })();
}

// =========================================================
// PRODUCTS: UPDATE PRODUCT WHILE OFFLINE
// =========================================================

function updateLocalProduct(productId, changes) {
    const database = initializeDatabase();
    const id = Number(productId);

    return database.transaction(() => {
        const existing = database.prepare(`
            SELECT * FROM products WHERE product_id = ?
        `).get(id);

        if (!existing) {
            throw new Error("Product not found in the local database.");
        }

        const updated = {
            ...existing,
            ...changes,
            product_id: id,
            updated_at: new Date().toISOString()
        };

        if (!String(updated.item_name || "").trim()) {
            throw new Error("Product name is required.");
        }

        const price = Number(updated.price);
        const quantity = Number(updated.quantity_in_stock);

        if (!Number.isFinite(price) || price < 0) {
            throw new Error("Enter a valid price.");
        }

        if (
            !Number.isInteger(quantity) ||
            quantity < 0
        ) {
            throw new Error("Enter a valid whole-number stock quantity.");
        }

        if (updated.category_id != null) {
            const category = database.prepare(`
                SELECT category_name
                FROM categories
                WHERE category_id = ?
            `).get(updated.category_id);

            if (!category) {
                throw new Error(
                    "The selected category is not available locally."
                );
            }

            updated.category_name = category.category_name;
        }

        updated.item_name = updated.item_name.trim();
        updated.price = price;
        updated.quantity_in_stock = quantity;

        database.prepare(`
            UPDATE products
            SET barcode = ?,
                item_name = ?,
                item_size = ?,
                price = ?,
                quantity_in_stock = ?,
                image_url = ?,
                category_name = ?,
                category_id = ?,
                updated_at = ?
            WHERE product_id = ?
        `).run(
            updated.barcode ?? null,
            updated.item_name,
            updated.item_size ?? "",
            updated.price,
            updated.quantity_in_stock,
            updated.image_url ?? null,
            updated.category_name ?? null,
            updated.category_id ?? null,
            updated.updated_at,
            id
        );

        const pendingCreate = database.prepare(`
            SELECT queue_id, payload
            FROM product_sync_queue
            WHERE product_id = ? AND operation = 'create'
            ORDER BY queue_id ASC
            LIMIT 1
        `).get(id);

        const pendingUpdate = database.prepare(`
            SELECT queue_id, payload
            FROM product_sync_queue
            WHERE product_id = ? AND operation = 'update'
            ORDER BY queue_id ASC
            LIMIT 1
        `).get(id);

        const payload = {
            ...updated,
            product_id: id
        };

        if (pendingCreate) {
            // Keep changes on the original create operation.
            database.prepare(`
                UPDATE product_sync_queue
                SET payload = ?
                WHERE queue_id = ?
            `).run(JSON.stringify(payload), pendingCreate.queue_id);
        } else if (pendingUpdate) {
            database.prepare(`
                UPDATE product_sync_queue
                SET payload = ?
                WHERE queue_id = ?
            `).run(JSON.stringify(payload), pendingUpdate.queue_id);
        } else {
            database.prepare(`
                INSERT INTO product_sync_queue (
                    product_id,
                    operation,
                    payload
                )
                VALUES (?, 'update', ?)
            `).run(id, JSON.stringify(payload));
        }

        return updated;
    })();
}

// =========================================================
// PRODUCTS: DELETE PRODUCT WHILE OFFLINE
// =========================================================

function deleteLocalProduct(productId) {
    const database = initializeDatabase();
    const id = Number(productId);

    return database.transaction(() => {
        const existing = database.prepare(`
            SELECT product_id
            FROM products
            WHERE product_id = ?
        `).get(id);

        if (!existing) {
            throw new Error("Product not found in the local database.");
        }

        const pendingCreate = database.prepare(`
            SELECT queue_id
            FROM product_sync_queue
            WHERE product_id = ? AND operation = 'create'
            LIMIT 1
        `).get(id);

        if (pendingCreate || id < 0) {
            // It has not been created on the server.
            database.prepare(`
                DELETE FROM product_sync_queue
                WHERE product_id = ?
            `).run(id);
        } else {
            database.prepare(`
                DELETE FROM product_sync_queue
                WHERE product_id = ?
            `).run(id);

            database.prepare(`
                INSERT INTO product_sync_queue (
                    product_id,
                    operation,
                    payload
                )
                VALUES (?, 'delete', ?)
            `).run(id, JSON.stringify({ product_id: id }));
        }

        database.prepare(`
            DELETE FROM products
            WHERE product_id = ?
        `).run(id);

        return { success: true, product_id: id };
    })();
}

// =========================================================
// PRODUCTS: DELETE IMAGE WHILE OFFLINE
// =========================================================

function deleteLocalProductImage(productId) {
    const database = initializeDatabase();
    const id = Number(productId);

    return database.transaction(() => {
        const existing = database.prepare(`
            SELECT *
            FROM products
            WHERE product_id = ?
        `).get(id);

        if (!existing) {
            throw new Error("Product not found in the local database.");
        }

        const pendingCreate = database.prepare(`
            SELECT queue_id, payload
            FROM product_sync_queue
            WHERE product_id = ? AND operation = 'create'
            LIMIT 1
        `).get(id);

        database.prepare(`
            UPDATE products
            SET image_url = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE product_id = ?
        `).run(id);

        if (pendingCreate) {
            const payload = {
                ...JSON.parse(pendingCreate.payload),
                image_url: null
            };

            database.prepare(`
                UPDATE product_sync_queue
                SET payload = ?
                WHERE queue_id = ?
            `).run(JSON.stringify(payload), pendingCreate.queue_id);
        } else if (id > 0) {
            // Remove an older queued update so operations do not
            // restore the image that the user just deleted.
            const pendingUpdate = database.prepare(`
                SELECT queue_id, payload
                FROM product_sync_queue
                WHERE product_id = ? AND operation = 'update'
                LIMIT 1
            `).get(id);

            if (pendingUpdate) {
                const payload = {
                    ...JSON.parse(pendingUpdate.payload),
                    image_url: null
                };

                database.prepare(`
                    UPDATE product_sync_queue
                    SET payload = ?
                    WHERE queue_id = ?
                `).run(JSON.stringify(payload), pendingUpdate.queue_id);
            } else {
                database.prepare(`
                    INSERT INTO product_sync_queue (
                        product_id,
                        operation,
                        payload
                    )
                    VALUES (?, 'image_delete', ?)
                `).run(id, JSON.stringify({ product_id: id }));
            }
        }

        return { success: true, product_id: id };
    })();
}

// =========================================================
// PRODUCTS: READ PENDING SYNC OPERATIONS
// =========================================================

function getProductSyncQueue() {
    return initializeDatabase().prepare(`
        SELECT queue_id, product_id, operation, payload, created_at
        FROM product_sync_queue
        ORDER BY queue_id ASC
    `).all();
}

// =========================================================
// PRODUCTS: REMOVE A COMPLETED SYNC OPERATION
// =========================================================

function removeProductSyncQueueItem(queueId) {
    return initializeDatabase().prepare(`
        DELETE FROM product_sync_queue
        WHERE queue_id = ?
    `).run(queueId);
}

// =========================================================
// PRODUCTS: COMPLETE OFFLINE PRODUCT CREATION
// =========================================================

function completeLocalProductSync(queueId, localProductId, serverProduct) {
    const database = initializeDatabase();

    return database.transaction(() => {
        const localProduct = database.prepare(`
            SELECT *
            FROM products
            WHERE product_id = ?
        `).get(localProductId);

        if (!localProduct) {
            throw new Error("The locally saved product was not found.");
        }

        const serverId = Number(serverProduct.product_id);

        if (!Number.isInteger(serverId) || serverId <= 0) {
            throw new Error("The server returned an invalid product ID.");
        }

        const existingServerProduct = database.prepare(`
            SELECT *
            FROM products
            WHERE product_id = ?
        `).get(serverId);

        const serverImage =
            serverProduct.image_url ||
            localProduct.image_url ||
            existingServerProduct?.image_url ||
            null;

        const serverCategoryId =
            serverProduct.category_id ??
            localProduct.category_id ??
            existingServerProduct?.category_id ??
            null;

        const serverCategoryName =
            serverProduct.category_name ??
            localProduct.category_name ??
            existingServerProduct?.category_name ??
            null;

        const productData = {
            product_id: serverId,
            barcode: serverProduct.barcode ?? localProduct.barcode,
            item_name: serverProduct.item_name ?? localProduct.item_name,
            item_size: serverProduct.item_size ?? localProduct.item_size,
            price: Number(serverProduct.price ?? localProduct.price) || 0,
            quantity_in_stock: Number(
                serverProduct.quantity_in_stock ??
                localProduct.quantity_in_stock
            ) || 0,
            image_url: serverImage,
            category_name: serverCategoryName,
            category_id: serverCategoryId
        };

        if (existingServerProduct && serverId !== Number(localProductId)) {
            database.prepare(`
                UPDATE products
                SET barcode = @barcode,
                    item_name = @item_name,
                    item_size = @item_size,
                    price = @price,
                    quantity_in_stock = @quantity_in_stock,
                    image_url = @image_url,
                    category_name = @category_name,
                    category_id = @category_id,
                    updated_at = CURRENT_TIMESTAMP
                WHERE product_id = @product_id
            `).run(productData);

            database.prepare(`
                DELETE FROM products
                WHERE product_id = ?
            `).run(localProductId);
        } else {
            database.prepare(`
                UPDATE products
                SET product_id = @product_id,
                    barcode = @barcode,
                    item_name = @item_name,
                    item_size = @item_size,
                    price = @price,
                    quantity_in_stock = @quantity_in_stock,
                    image_url = @image_url,
                    category_name = @category_name,
                    category_id = @category_id,
                    updated_at = CURRENT_TIMESTAMP
                WHERE product_id = @local_id
            `).run({
                ...productData,
                local_id: localProductId
            });
        }

        database.prepare(`
            UPDATE product_sync_queue
            SET product_id = ?
            WHERE product_id = ?
              AND operation != 'create'
        `).run(serverId, localProductId);

        database.prepare(`
            DELETE FROM product_sync_queue
            WHERE queue_id = ?
              AND operation = 'create'
        `).run(queueId);

        return productData;
    })();
}


// =========================================================
// CATEGORIES: READ LOCAL CACHE
// =========================================================

function getCachedCategories() {
    return initializeDatabase().prepare(`
        SELECT category_id, category_name
        FROM categories
        ORDER BY category_name ASC
    `).all();
}

// =========================================================
// CATEGORIES: SAVE SERVER CATEGORIES TO LOCAL CACHE
// =========================================================

function saveCachedCategories(categories) {
    if (!Array.isArray(categories)) {
        throw new Error("Categories must be an array.");
    }

    const database = initializeDatabase();

    const saveTransaction = database.transaction(items => {
        const saveCategory = database.prepare(`
            INSERT INTO categories (category_id, category_name)
            VALUES (@category_id, @category_name)
            ON CONFLICT(category_id) DO UPDATE SET
                category_name = excluded.category_name
        `);

        const saveCategoryByName = database.prepare(`
            INSERT OR IGNORE INTO categories (category_name)
            VALUES (@category_name)
        `);

        for (const category of items) {
            if (!category.category_name) continue;

            if (category.category_id != null) {
                saveCategory.run({
                    category_id: category.category_id,
                    category_name: category.category_name
                });
            } else {
                saveCategoryByName.run({
                    category_name: category.category_name
                });
            }
        }
    });

    saveTransaction(categories);

    return { saved: categories.length };
}

// =========================================================
// CUSTOMERS: READ LOCAL CACHE
// =========================================================

function getCachedCustomers() {
    return initializeDatabase().prepare(`
        SELECT
            customer_id,
            name,
            phone_number,
            email,
            customer_type,
            sync_status
        FROM customers
        ORDER BY name ASC
    `).all();
}

// =========================================================
// CUSTOMERS: SAVE SERVER CUSTOMERS TO LOCAL CACHE
// =========================================================

function saveCachedCustomers(customers) {
    if (!Array.isArray(customers)) {
        throw new Error("Customers must be an array.");
    }

    const database = initializeDatabase();

    const saveTransaction = database.transaction(items => {
        const saveCustomer = database.prepare(`
            INSERT INTO customers (
                customer_id,
                name,
                phone_number,
                email,
                customer_type,
                sync_status
            )
            VALUES (
                @customer_id,
                @name,
                @phone_number,
                @email,
                @customer_type,
                'synced'
            )
            ON CONFLICT(customer_id) DO UPDATE SET
                name = excluded.name,
                phone_number = excluded.phone_number,
                email = excluded.email,
                customer_type = excluded.customer_type,
                sync_status = 'synced'
            WHERE customers.sync_status = 'synced'
        `);

        for (const customer of items) {
            if (
                customer.customer_id == null ||
                !customer.name
            ) {
                continue;
            }

            saveCustomer.run({
                customer_id: customer.customer_id,
                name: customer.name,
                phone_number: customer.phone_number ?? null,
                email: customer.email ?? null,
                customer_type: customer.customer_type || "Cash"
            });
        }
    });

    saveTransaction(customers);

    return { saved: customers.length };
}

// =========================================================
// CUSTOMERS: CREATE OFFLINE CUSTOMER
// =========================================================

function createLocalCustomer(customer) {
    if (!customer || !customer.name?.trim()) {
        throw new Error("Customer name is required.");
    }

    const database = initializeDatabase();

    return database.transaction(() => {
        const nextId = database.prepare(`
            SELECT MIN(customer_id) AS lowest_id
            FROM customers
            WHERE customer_id < 0
        `).get();

        const customerId =
            nextId.lowest_id == null ? -1 : nextId.lowest_id - 1;

        const newCustomer = {
            customer_id: customerId,
            name: customer.name.trim(),
            phone_number: customer.phone_number ?? null,
            email: customer.email ?? null,
            customer_type: customer.customer_type || "Cash"
        };

        database.prepare(`
            INSERT INTO customers (
                customer_id,
                name,
                phone_number,
                email,
                customer_type,
                sync_status
            )
            VALUES (
                @customer_id,
                @name,
                @phone_number,
                @email,
                @customer_type,
                'pending'
            )
        `).run(newCustomer);

        database.prepare(`
            INSERT INTO customer_sync_queue (
                customer_id,
                operation,
                payload
            )
            VALUES (?, 'create', ?)
        `).run(customerId, JSON.stringify(newCustomer));

        return newCustomer;
    })();
}

// =========================================================
// CUSTOMERS: UPDATE OFFLINE CUSTOMER
// =========================================================

function updateLocalCustomer(customerId, changes) {
    if (!changes || !changes.name?.trim()) {
        throw new Error("Customer name is required.");
    }

    const database = initializeDatabase();

    return database.transaction(() => {
        const existingCustomer = database.prepare(`
            SELECT *
            FROM customers
            WHERE customer_id = ?
        `).get(customerId);

        if (!existingCustomer) {
            throw new Error("Customer was not found locally.");
        }

        const updatedCustomer = {
            customer_id: customerId,
            name: changes.name.trim(),
            phone_number:
                changes.phone_number ?? existingCustomer.phone_number,
            email: changes.email ?? existingCustomer.email,
            customer_type:
                changes.customer_type ??
                existingCustomer.customer_type ??
                "Cash"
        };

        database.prepare(`
            UPDATE customers
            SET name = @name,
                phone_number = @phone_number,
                email = @email,
                customer_type = @customer_type,
                sync_status = 'pending'
            WHERE customer_id = @customer_id
        `).run(updatedCustomer);

        const pendingCreate = database.prepare(`
            SELECT queue_id
            FROM customer_sync_queue
            WHERE customer_id = ?
              AND operation = 'create'
            ORDER BY queue_id ASC
            LIMIT 1
        `).get(customerId);

        if (pendingCreate) {
            database.prepare(`
                UPDATE customer_sync_queue
                SET payload = ?
                WHERE queue_id = ?
            `).run(
                JSON.stringify(updatedCustomer),
                pendingCreate.queue_id
            );
        } else {
            database.prepare(`
                DELETE FROM customer_sync_queue
                WHERE customer_id = ?
                  AND operation = 'update'
            `).run(customerId);

            database.prepare(`
                INSERT INTO customer_sync_queue (
                    customer_id,
                    operation,
                    payload
                )
                VALUES (?, 'update', ?)
            `).run(customerId, JSON.stringify(updatedCustomer));
        }

        return updatedCustomer;
    })();
}

// =========================================================
// CUSTOMERS: READ PENDING SYNC OPERATIONS
// =========================================================

function getCustomerSyncQueue() {
    return initializeDatabase().prepare(`
        SELECT queue_id, customer_id, operation, payload, created_at
        FROM customer_sync_queue
        ORDER BY queue_id ASC
    `).all();
}

// =========================================================
// CUSTOMERS: REMOVE COMPLETED SYNC OPERATION
// =========================================================

function removeCustomerSyncQueueItem(queueId) {
    return initializeDatabase().prepare(`
        DELETE FROM customer_sync_queue
        WHERE queue_id = ?
    `).run(queueId);
}

// =========================================================
// CUSTOMERS: REMAP LOCAL ID TO SERVER ID
// =========================================================

function remapLocalCustomerId(localCustomerId, serverCustomerId) {
    const database = initializeDatabase();

    return database.transaction(() => {
        const localCustomer = database.prepare(`
            SELECT *
            FROM customers
            WHERE customer_id = ?
        `).get(localCustomerId);

        if (!localCustomer) {
            throw new Error("Local customer was not found.");
        }

        database.prepare(`
            UPDATE customers
            SET customer_id = ?,
                sync_status = 'synced'
            WHERE customer_id = ?
        `).run(serverCustomerId, localCustomerId);

        database.prepare(`
            UPDATE customer_sync_queue
            SET customer_id = ?
            WHERE customer_id = ?
        `).run(serverCustomerId, localCustomerId);

        return {
            ...localCustomer,
            customer_id: serverCustomerId,
            sync_status: "synced"
        };
    })();
}

// =========================================================
// EXPORT DATABASE FUNCTIONS
// =========================================================

module.exports = {
    initializeDatabase,

    // Products
    getCachedProducts,
    saveCachedProducts,
    createLocalProduct,
    updateLocalProduct,
    deleteLocalProduct,
    deleteLocalProductImage,
    getProductSyncQueue,
    removeProductSyncQueueItem,
    completeLocalProductSync,

    // Categories
    getCachedCategories,
    saveCachedCategories,

    // Customers
    getCachedCustomers,
    saveCachedCustomers,
    createLocalCustomer,
    updateLocalCustomer,
    getCustomerSyncQueue,
    removeCustomerSyncQueueItem,
    remapLocalCustomerId
};
