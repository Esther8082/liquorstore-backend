
const {
    app,
    BrowserWindow,
    ipcMain,
    Menu
} = require("electron");

const path = require("path");

const {
    initializeDatabase,
    getCachedProducts,
    saveCachedProducts,
    getCachedCategories,
    saveCachedCategories,
    getCachedCustomers,
    saveCachedCustomers,
    createLocalCustomer,
    updateLocalCustomer,
    getCustomerSyncQueue,
    removeCustomerSyncQueueItem,
    remapLocalCustomerId,
    createLocalProduct,
    updateLocalProduct,
    deleteLocalProduct,
    deleteLocalProductImage,
    getProductSyncQueue
} = require("./database/database.js");

const { getInventoryProducts } = require("./inventory-offline.js");
const { syncPendingProducts } = require("./product-sync.js");
const { createOfflineProduct } = require("./product-offline.js");

function registerDatabaseHandlers() {
    // PRODUCTS: LOCAL CACHE
    ipcMain.handle("db:get-products", () => {
        return getCachedProducts();
    });

    ipcMain.handle("db:save-products", (_event, products) => {
        return saveCachedProducts(products);
    });

    // PRODUCTS: OFFLINE CREATION
    ipcMain.handle("db:create-product", (_event, product) => {
        return createOfflineProduct(product);
    });

    // PRODUCTS: OFFLINE STOCK ADJUSTMENTS
    ipcMain.handle(
        "db:update-local-product",
        (_event, productId, changes) => {
            return updateLocalProduct(productId, changes);
        }
    );

    ipcMain.handle(
        "db:delete-local-product",
        (_event, productId) => {
            return deleteLocalProduct(productId);
        }
    );

    ipcMain.handle(
        "db:delete-local-product-image",
        (_event, productId) => {
            return deleteLocalProductImage(productId);
        }
    );

    ipcMain.handle("db:get-product-sync-queue", () => {
        return getProductSyncQueue();
    });

    // PRODUCT SYNCHRONISATION
    ipcMain.handle("db:sync-products", async () => {
        return await syncPendingProducts();
    });

    // INVENTORY
    ipcMain.handle("inventory:get-products", async () => {
        return await getInventoryProducts();
    });

    // CATEGORIES
    ipcMain.handle("db:get-categories", () => {
        return getCachedCategories();
    });

    ipcMain.handle("db:save-categories", (_event, categories) => {
        return saveCachedCategories(categories);
    });

    // CUSTOMERS
    ipcMain.handle("db:get-customers", () => {
        return getCachedCustomers();
    });

    ipcMain.handle("db:save-customers", (_event, customers) => {
        return saveCachedCustomers(customers);
    });

    ipcMain.handle("db:create-local-customer", (_event, customer) => {
        return createLocalCustomer(customer);
    });

    ipcMain.handle(
        "db:update-local-customer",
        (_event, customerId, changes) => {
            return updateLocalCustomer(customerId, changes);
        }
    );

    ipcMain.handle("db:get-customer-sync-queue", () => {
        return getCustomerSyncQueue();
    });

    ipcMain.handle(
        "db:remove-customer-sync-item",
        (_event, queueId) => {
            return removeCustomerSyncQueueItem(queueId);
        }
    );

    ipcMain.handle(
        "db:remap-local-customer-id",
        (_event, localCustomerId, serverCustomerId) => {
            return remapLocalCustomerId(
                localCustomerId,
                serverCustomerId
            );
        }
    );
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 650,
        title: "Liquor Store POS",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: true
        }
    });

    mainWindow.loadFile(
        path.join(__dirname, "../frontend/index.html")
    );

    mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    try {
        initializeDatabase();
        registerDatabaseHandlers();

        console.log("Local database is ready.");
        createWindow();
    } catch (error) {
        console.error("Failed to initialize local database:", error);
        app.quit();
        return;
    }

    // Synchronise queued products when the app starts.
    syncPendingProducts().catch(error => {
        console.error("Initial product sync failed:", error);
    });

    // Retry every 30 seconds.
    setInterval(() => {
        syncPendingProducts().catch(error => {
            console.error("Automatic product sync failed:", error);
        });
    }, 30000);

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
