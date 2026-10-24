
import { API_BASE_URL } from "../config/api.js";

// =====================================================
// STATE
// =====================================================

let products = [];
let categories = [];
let changedRows = new Set();
let selectedProductId = null;
let isSaving = false;

const tbody = document.getElementById("stock-body");
const saveBtn = document.getElementById("save-all");
const contextMenu = document.getElementById("context-menu");
const deleteRowOption = document.getElementById("delete-row-option");
const deleteImageOption = document.getElementById("delete-image-option");
const closeBtn = document.getElementById("closeStockAdjustmentBtn");

const NO_IMAGE = "https://placehold.co/100x100?text=No+Image";

const offlineDB = window.posDatabase || null;

// =====================================================
// HELPERS
// =====================================================

function normaliseArray(data, propertyName) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[propertyName])) return data[propertyName];
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.[propertyName])) {
        return data.data[propertyName];
    }

    return [];
}

function isNetworkError(error) {
    return (
        error instanceof TypeError ||
        error?.name === "NetworkError" ||
        error?.name === "TimeoutError"
    );
}

function showError(message) {
    alert(message);
}

function findProduct(id) {
    return products.find(
        product => String(product.product_id) === String(id)
    );
}

function toNumber(value, fieldName, minimum = 0) {
    if (value === "" || value === null || value === undefined) {
        throw new Error(`${fieldName} is required.`);
    }

    const number = Number(value);

    if (!Number.isFinite(number) || number < minimum) {
        throw new Error(
            `${fieldName} must be a valid number greater than or equal to ${minimum}.`
        );
    }

    return number;
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read the selected image."));

        reader.readAsDataURL(file);
    });
}

async function readResponse(response) {
    const text = await response.text();

    if (!text) return {};

    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
}

function getErrorMessage(data, fallback) {
    return data?.error || data?.details || data?.message || fallback;
}

function updateCachedProduct(updatedProduct) {
    if (!offlineDB) return;

    const updatedProducts = products.map(product =>
        String(product.product_id) === String(updatedProduct.product_id)
            ? { ...product, ...updatedProduct }
            : product
    );

    return offlineDB.saveProducts(updatedProducts);
}

async function getLocalProducts() {
    if (!offlineDB) {
        throw new Error("The local product database is unavailable.");
    }

    return offlineDB.getProducts();
}

async function getLocalCategories() {
    if (!offlineDB) {
        throw new Error("The local category database is unavailable.");
    }

    return offlineDB.getCategories();
}

// =====================================================
// RENDER PRODUCTS
// =====================================================

function renderProducts() {
    tbody.innerHTML = "";

    products.forEach(product => {
        const row = document.createElement("tr");
        const id = String(product.product_id);

        row.dataset.id = id;

        const nameCell = document.createElement("td");
        const nameInput = document.createElement("input");
        nameInput.className = "name-input";
        nameInput.dataset.id = id;
        nameInput.value = product.item_name ?? "";
        nameCell.appendChild(nameInput);

        const barcodeCell = document.createElement("td");
        const barcodeInput = document.createElement("input");
        barcodeInput.className = "barcode-input";
        barcodeInput.dataset.id = id;
        barcodeInput.value = product.barcode ?? "";
        barcodeCell.appendChild(barcodeInput);

        const categoryCell = document.createElement("td");
        categoryCell.className = "category-cell";
        categoryCell.dataset.id = id;
        categoryCell.textContent =
            product.category_name ||
            categories.find(
                category =>
                    String(category.category_id) === String(product.category_id)
            )?.category_name ||
            "Uncategorised";

        const stockCell = document.createElement("td");
        const stockInput = document.createElement("input");
        stockInput.type = "number";
        stockInput.min = "0";
        stockInput.step = "1";
        stockInput.className = "stock-input";
        stockInput.dataset.id = id;
        stockInput.value = Number(product.quantity_in_stock) || 0;
        stockCell.appendChild(stockInput);

        const priceCell = document.createElement("td");
        const priceInput = document.createElement("input");
        priceInput.type = "number";
        priceInput.min = "0";
        priceInput.step = "0.01";
        priceInput.className = "price-input";
        priceInput.dataset.id = id;
        priceInput.value = Number(product.price) || 0;
        priceCell.appendChild(priceInput);

        const imageCell = document.createElement("td");

        const image = document.createElement("img");
        image.src = product.image_url || NO_IMAGE;
        image.alt = product.item_name || "Product image";
        image.className = "stock-image";
        image.onerror = () => {
            image.onerror = null;
            image.src = NO_IMAGE;
        };

        const imageInput = document.createElement("input");
        imageInput.type = "file";
        imageInput.className = "image-input";
        imageInput.dataset.id = id;
        imageInput.accept = "image/*";

        imageInput.addEventListener("change", () => {
            if (imageInput.files?.length) {
                changedRows.add(id);
                image.src = URL.createObjectURL(imageInput.files[0]);
            }
        });

        imageCell.append(image, imageInput);

        row.append(
            nameCell,
            barcodeCell,
            categoryCell,
            stockCell,
            priceCell,
            imageCell
        );

        tbody.appendChild(row);
    });
}

// =====================================================
// LOAD PRODUCTS: ONLINE FIRST, LOCAL FALLBACK
// =====================================================

async function loadProducts() {
    try {
        let response;

        try {
            response = await fetch(`${API_BASE_URL}/products`);

            if (!response.ok) {
                throw new Error(`The server returned HTTP ${response.status}.`);
            }
        } catch (error) {
            if (!isNetworkError(error)) throw error;

            const localProducts = await getLocalProducts();
            products = normaliseArray(localProducts, "products");

            renderProducts();
            console.warn("Loaded products from the local database.");
            return;
        }

        const data = await readResponse(response);
        const onlineProducts = normaliseArray(data, "products");

        // Do not overwrite locally edited products while sync is pending.
        let pendingQueue = [];

        if (offlineDB?.getProductSyncQueue) {
            try {
                pendingQueue = await offlineDB.getProductSyncQueue();
            } catch (error) {
                console.warn("Could not inspect the product sync queue:", error);
            }
        }

        if (pendingQueue.length > 0) {
            const localProducts = normaliseArray(
                await getLocalProducts(),
                "products"
            );

            const locallyChangedIds = new Set(
                pendingQueue
                    .filter(item => item.operation !== "create")
                    .map(item => String(item.product_id))
            );

            const localCreates = localProducts.filter(product =>
                pendingQueue.some(
                    item =>
                        item.operation === "create" &&
                        String(item.product_id) === String(product.product_id)
                )
            );

            const preservedProducts = onlineProducts.filter(
                product => !locallyChangedIds.has(String(product.product_id))
            );

            const locallyChangedProducts = localProducts.filter(product =>
                locallyChangedIds.has(String(product.product_id))
            );

            products = [
                ...preservedProducts,
                ...locallyChangedProducts,
                ...localCreates
            ];

            // Preserve queued deletions locally; don't show them again.
            const deletedIds = new Set(
                pendingQueue
                    .filter(item => item.operation === "delete")
                    .map(item => String(item.product_id))
            );

            products = products.filter(
                product => !deletedIds.has(String(product.product_id))
            );
        } else {
            products = onlineProducts;

            if (offlineDB) {
                await offlineDB.saveProducts(products);
            }
        }

        renderProducts();
    } catch (error) {
        console.error("LOAD PRODUCTS ERROR:", error);

        try {
            products = normaliseArray(await getLocalProducts(), "products");
            renderProducts();
            console.warn("Using locally cached products.");
        } catch (localError) {
            console.error("LOCAL PRODUCT LOAD ERROR:", localError);

            showError(
                "Products could not be loaded from the server or local database."
            );
        }
    }
}

// =====================================================
// LOAD CATEGORIES: ONLINE FIRST, LOCAL FALLBACK
// =====================================================

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);

        if (!response.ok) {
            throw new Error(`The server returned HTTP ${response.status}.`);
        }

        const data = await readResponse(response);
        categories = normaliseArray(data, "categories");

        if (offlineDB) {
            await offlineDB.saveCategories(categories);
        }
    } catch (error) {
        console.warn("Could not load online categories:", error);

        try {
            categories = normaliseArray(
                await getLocalCategories(),
                "categories"
            );
        } catch (localError) {
            console.error("LOCAL CATEGORY LOAD ERROR:", localError);
            categories = [];
        }
    }
}

// =====================================================
// INITIAL LOAD
// =====================================================

async function initialisePage() {
    await loadCategories();
    await loadProducts();
}

initialisePage();

// =====================================================
// TRACK CHANGES
// =====================================================

tbody.addEventListener("input", event => {
    const input = event.target;

    if (input.dataset.id) {
        changedRows.add(String(input.dataset.id));
    }
});

// =====================================================
// SAVE ALL CHANGES: ONLINE FIRST, OFFLINE QUEUE
// =====================================================

saveBtn.addEventListener("click", async () => {
    if (isSaving) return;

    if (changedRows.size === 0) {
        showError("No changes made.");
        return;
    }

    isSaving = true;
    saveBtn.disabled = true;

    const idsToSave = [...changedRows];
    let savedOnline = 0;
    let savedOffline = 0;

    try {
        for (const id of idsToSave) {
            const product = findProduct(id);

            if (!product) {
                changedRows.delete(id);
                continue;
            }

            const nameInput = document.querySelector(
                `.name-input[data-id="${id}"]`
            );
            const barcodeInput = document.querySelector(
                `.barcode-input[data-id="${id}"]`
            );
            const stockInput = document.querySelector(
                `.stock-input[data-id="${id}"]`
            );
            const priceInput = document.querySelector(
                `.price-input[data-id="${id}"]`
            );
            const imageInput = document.querySelector(
                `.image-input[data-id="${id}"]`
            );

            try {
                const itemName = nameInput.value.trim();

                if (!itemName) {
                    throw new Error("Product name cannot be empty.");
                }

                const quantity = toNumber(
                    stockInput.value,
                    "Stock quantity"
                );

                if (!Number.isInteger(quantity)) {
                    throw new Error("Stock quantity must be a whole number.");
                }

                const price = toNumber(priceInput.value, "Price");

                const changes = {
                    item_name: itemName,
                    item_size: product.item_size ?? "",
                    barcode: barcodeInput.value.trim(),
                    category_id: product.category_id ?? null,
                    quantity_in_stock: quantity,
                    price
                };

                const selectedImage = imageInput.files?.[0];

                if (selectedImage) {
                    if (!selectedImage.type.startsWith("image/")) {
                        throw new Error("Please select a valid image file.");
                    }

                    changes.image_url = await fileToDataUrl(selectedImage);
                }

                const formData = new FormData();

                formData.append("item_name", changes.item_name);
                formData.append("item_size", changes.item_size);
                formData.append("barcode", changes.barcode);
                formData.append(
                    "category_id",
                    String(changes.category_id ?? "")
                );
                formData.append(
                    "quantity_in_stock",
                    String(changes.quantity_in_stock)
                );
                formData.append("price", String(changes.price));

                if (selectedImage) {
                    formData.append("image", selectedImage);
                }

                let savedLocally = false;

                // Locally created products must finish their queued creation
                // rather than attempting PUT with a temporary negative ID.
                if (Number(id) < 0) {
                    if (!offlineDB?.updateLocalProduct) {
                        throw new Error(
                            "Offline product editing is not available. Check the desktop preload configuration."
                        );
                    }

                    await offlineDB.updateLocalProduct(id, changes);
                    savedLocally = true;
                } else {
                    let response;

                    try {
                        response = await fetch(
                            `${API_BASE_URL}/products/${encodeURIComponent(id)}`,
                            {
                                method: "PUT",
                                body: formData
                            }
                        );
                    } catch (error) {
                        if (!isNetworkError(error)) throw error;

                        if (!offlineDB?.updateLocalProduct) {
                            throw new Error(
                                "The server is unreachable and offline saving is unavailable."
                            );
                        }

                        await offlineDB.updateLocalProduct(id, changes);
                        savedLocally = true;
                    }

                    if (response) {
                        const data = await readResponse(response);

                        if (!response.ok) {
                            throw new Error(
                                getErrorMessage(
                                    data,
                                    `Failed to update product ${id} (HTTP ${response.status}).`
                                )
                            );
                        }

                        savedOnline += 1;
                    }
                }

                if (savedLocally) {
                    savedOffline += 1;
                }

                changedRows.delete(id);
            } catch (error) {
                console.error(`SAVE PRODUCT ${id} ERROR:`, error);

                showError(`Product ${id}: ${error.message}`);
                return;
            }
        }

        if (savedOnline > 0 && savedOffline === 0) {
            showError(`${savedOnline} product(s) saved online.`);
        } else if (savedOffline > 0 && savedOnline === 0) {
            showError(
                `${savedOffline} product(s) saved locally. They will sync when the connection returns.`
            );
        } else {
            showError(
                `${savedOnline} product(s) saved online and ${savedOffline} saved locally for later sync.`
            );
        }

        await loadProducts();
    } finally {
        isSaving = false;
        saveBtn.disabled = false;
    }
});

// =====================================================
// CONTEXT MENU
// =====================================================

tbody.addEventListener("contextmenu", event => {
    event.preventDefault();

    const row = event.target.closest("tr");
    if (!row) return;

    document.querySelectorAll("#stock-body tr").forEach(existingRow => {
        existingRow.classList.remove("selected-row");
    });

    row.classList.add("selected-row");
    selectedProductId = row.dataset.id;

    const clickedImage = event.target.classList.contains("stock-image");

    deleteImageOption.style.display = clickedImage ? "block" : "none";
    contextMenu.style.display = "flex";
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;
});

document.addEventListener("click", event => {
    if (
        contextMenu &&
        !contextMenu.contains(event.target)
    ) {
        contextMenu.style.display = "none";
    }
});

// =====================================================
// DELETE PRODUCT: ONLINE FIRST, OFFLINE QUEUE
// =====================================================

deleteRowOption.addEventListener("click", async event => {
    event.stopPropagation();
    contextMenu.style.display = "none";

    if (selectedProductId === null) return;

    if (!confirm("Are you sure you want to delete this product?")) return;

    const id = String(selectedProductId);

    try {
        if (Number(id) < 0) {
            if (!offlineDB?.deleteLocalProduct) {
                throw new Error("Offline product deletion is unavailable.");
            }

            await offlineDB.deleteLocalProduct(id);
        } else {
            let response;

            try {
                response = await fetch(
                    `${API_BASE_URL}/products/${encodeURIComponent(id)}`,
                    { method: "DELETE" }
                );
            } catch (error) {
                if (!isNetworkError(error)) throw error;

                if (!offlineDB?.deleteLocalProduct) {
                    throw new Error(
                        "The server is unreachable and offline deletion is unavailable."
                    );
                }

                await offlineDB.deleteLocalProduct(id);
                response = null;
            }

            if (response) {
                const data = await readResponse(response);

                if (!response.ok) {
                    throw new Error(
                        getErrorMessage(data, "Failed to delete product.")
                    );
                }

                if (offlineDB) {
                    const remaining = products.filter(
                        product => String(product.product_id) !== id
                    );

                    await offlineDB.saveProducts(remaining);
                }
            }
        }

        products = products.filter(
            product => String(product.product_id) !== id
        );

        changedRows.delete(id);
        renderProducts();

        showError(
            Number(id) < 0
                ? "Locally created product deleted."
                : "Product deleted. If offline, deletion is queued for syncing."
        );
    } catch (error) {
        console.error("DELETE PRODUCT ERROR:", error);
        showError(error.message || "Failed to delete product.");
    }
});

// =====================================================
// DELETE IMAGE: ONLINE FIRST, OFFLINE QUEUE
// =====================================================

deleteImageOption.addEventListener("click", async event => {
    event.stopPropagation();
    contextMenu.style.display = "none";

    if (selectedProductId === null) return;

    if (!confirm("Delete only this image?")) return;

    const id = String(selectedProductId);

    try {
        if (Number(id) < 0) {
            if (!offlineDB?.deleteLocalProductImage) {
                throw new Error("Offline image deletion is unavailable.");
            }

            await offlineDB.deleteLocalProductImage(id);
        } else {
            let response;

            try {
                response = await fetch(
                    `${API_BASE_URL}/products/${encodeURIComponent(id)}/image`,
                    { method: "DELETE" }
                );
            } catch (error) {
                if (!isNetworkError(error)) throw error;

                if (!offlineDB?.deleteLocalProductImage) {
                    throw new Error(
                        "The server is unreachable and offline image deletion is unavailable."
                    );
                }

                await offlineDB.deleteLocalProductImage(id);
                response = null;
            }

            if (response) {
                const data = await readResponse(response);

                if (!response.ok) {
                    throw new Error(
                        getErrorMessage(data, "Failed to delete product image.")
                    );
                }
            }
        }

        products = products.map(product =>
            String(product.product_id) === id
                ? { ...product, image_url: null }
                : product
        );

        if (offlineDB && Number(id) >= 0) {
            await offlineDB.saveProducts(products);
        }

        renderProducts();

        showError(
            "Product image removed. If offline, removal is queued for syncing."
        );
    } catch (error) {
        console.error("DELETE IMAGE ERROR:", error);
        showError(error.message || "Failed to delete product image.");
    }
});

// =====================================================
// CLOSE PAGE
// =====================================================

closeBtn.addEventListener("click", () => {
    contextMenu.style.display = "none";

    if (changedRows.size === 0) {
        window.location.href = "../index.html";
        return;
    }

    const shouldClose = confirm(
        "You have unsaved changes. Are you sure you want to leave without saving?"
    );

    if (shouldClose) {
        window.location.href = "../index.html";
    }
});
