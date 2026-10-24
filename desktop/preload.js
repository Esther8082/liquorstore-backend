
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("posDatabase", {
    // Products: local cache
    getProducts: () =>
        ipcRenderer.invoke("db:get-products"),

    saveProducts: (products) =>
        ipcRenderer.invoke("db:save-products", products),

    // Products: offline creation
    createLocalProduct: (product) =>
        ipcRenderer.invoke("db:create-product", product),

    // Products: offline stock adjustments
    updateLocalProduct: (productId, changes) =>
        ipcRenderer.invoke(
            "db:update-local-product",
            productId,
            changes
        ),

    deleteLocalProduct: (productId) =>
        ipcRenderer.invoke(
            "db:delete-local-product",
            productId
        ),

    deleteLocalProductImage: (productId) =>
        ipcRenderer.invoke(
            "db:delete-local-product-image",
            productId
        ),

    // Product synchronisation
    syncProducts: () =>
        ipcRenderer.invoke("db:sync-products"),

    getProductSyncQueue: () =>
        ipcRenderer.invoke("db:get-product-sync-queue"),

    // Categories
    getCategories: () =>
        ipcRenderer.invoke("db:get-categories"),

    saveCategories: (categories) =>
        ipcRenderer.invoke("db:save-categories", categories),

    // Customers
    getCustomers: () =>
        ipcRenderer.invoke("db:get-customers"),

    saveCustomers: (customers) =>
        ipcRenderer.invoke("db:save-customers", customers),

    createLocalCustomer: (customer) =>
        ipcRenderer.invoke("db:create-local-customer", customer),

    updateLocalCustomer: (customerId, changes) =>
        ipcRenderer.invoke(
            "db:update-local-customer",
            customerId,
            changes
        ),

    getCustomerSyncQueue: () =>
        ipcRenderer.invoke("db:get-customer-sync-queue"),

    removeCustomerSyncQueueItem: (queueId) =>
        ipcRenderer.invoke(
            "db:remove-customer-sync-item",
            queueId
        ),

    remapLocalCustomerId: (localCustomerId, serverCustomerId) =>
        ipcRenderer.invoke(
            "db:remap-local-customer-id",
            localCustomerId,
            serverCustomerId
        )
});

// Inventory page compatibility
contextBridge.exposeInMainWorld("inventoryOffline", {
    getInventoryProducts: () =>
        ipcRenderer.invoke("inventory:get-products")
});
