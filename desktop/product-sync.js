
const {
    getProductSyncQueue,
    completeLocalProductSync,
    removeProductSyncQueueItem
} = require("./database/database.js");

const API_BASE_URL = "https://liquorstore-api.onrender.com";

let syncInProgress = false;

function dataUrlToBlob(dataUrl) {
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/.exec(dataUrl);

    if (!match) {
        throw new Error("The saved product image is invalid.");
    }

    const mimeType = match[1];
    const bytes = Buffer.from(match[2], "base64");

    return new Blob([bytes], { type: mimeType });
}

function appendProductFields(formData, product) {
    formData.append("item_name", String(product.item_name ?? ""));
    formData.append("item_size", String(product.item_size ?? ""));
    formData.append("barcode", String(product.barcode ?? ""));
    formData.append("category_id", String(product.category_id ?? ""));
    formData.append(
        "quantity_in_stock",
        String(Number(product.quantity_in_stock) || 0)
    );
    formData.append("price", String(Number(product.price) || 0));

    if (product.image_url?.startsWith("data:image/")) {
        const imageBlob = dataUrlToBlob(product.image_url);
        const extension = imageBlob.type.split("/")[1] || "png";

        formData.append(
            "image",
            imageBlob,
            `product-${Math.abs(Number(product.product_id) || 0)}.${extension}`
        );
    }
}

async function syncPendingProducts() {
    if (syncInProgress) {
        return {
            synced: 0,
            message: "Product sync is already running."
        };
    }

    syncInProgress = true;
    let synced = 0;

    try {
        const queue = getProductSyncQueue();

        if (!queue.length) {
            return {
                synced: 0,
                message: "No products are waiting to sync."
            };
        }

        for (const queuedItem of queue) {
            const product = JSON.parse(queuedItem.payload);
            const operation = queuedItem.operation;
            const productId = queuedItem.product_id ?? product.product_id;

            let url;
            let method;
            let body;

            if (operation === "delete") {
                url = `${API_BASE_URL}/products/${productId}`;
                method = "DELETE";
            } else if (operation === "image_delete") {
                url = `${API_BASE_URL}/products/${productId}/image`;
                method = "DELETE";
            } else if (operation === "create") {
                url = `${API_BASE_URL}/products`;
                method = "POST";

                body = new FormData();
                appendProductFields(body, product);
            } else if (operation === "update") {
                url = `${API_BASE_URL}/products/${productId}`;
                method = "PUT";

                body = new FormData();
                appendProductFields(body, product);
            } else {
                console.error("Unknown product sync operation:", operation);
                continue;
            }

// Before creating an offline product, check whether the server
// already has the same barcode from an earlier sync attempt.
if (operation === "create" && product.barcode) {
    let lookupResponse;

    try {
        lookupResponse = await fetch(
            `${API_BASE_URL}/products/barcode/${encodeURIComponent(product.barcode)}`
        );
    } catch (error) {
        console.error("Could not check product barcode:", error);

        return {
            synced,
            message: "Could not verify the product on the server. The creation remains queued."
        };
    }

    if (lookupResponse.ok) {
        let existingProduct;

        try {
            existingProduct = await lookupResponse.json();
        } catch {
            return {
                synced,
                message: "The barcode lookup returned invalid data. The creation remains queued."
            };
        }

        // Only reconcile if the existing record matches this product.
        const sameProduct =
            String(existingProduct.barcode ?? "") === String(product.barcode) &&
            String(existingProduct.item_name ?? "").trim().toLowerCase() ===
                String(product.item_name ?? "").trim().toLowerCase() &&
            String(existingProduct.item_size ?? "").trim().toLowerCase() ===
                String(product.item_size ?? "").trim().toLowerCase();

        if (!sameProduct) {
            console.error(
                "Barcode already belongs to a different product:",
                existingProduct
            );

            return {
                synced,
                message: "This barcode already belongs to a different product. No new product was created."
            };
        }

        completeLocalProductSync(
            queuedItem.queue_id,
            product.product_id,
            existingProduct
        );

        synced += 1;
        continue;
    }

    // A 404 means the barcode was not found, so normal creation may proceed.
    if (lookupResponse.status !== 404) {
        console.error(
            "Barcode lookup failed:",
            lookupResponse.status,
            await lookupResponse.text().catch(() => "")
        );

        return {
            synced,
            message: "Could not verify whether this product already exists. The creation remains queued."
        };
    }
}


            let response;

            try {
                response = await fetch(url, { method, body });
            } catch (error) {
                console.error("Product sync network error:", error);

                return {
                    synced,
                    message: "Internet is unavailable. Changes remain saved locally."
                };
            }

            if (!response.ok) {
                const message = await response.text().catch(() => "");

                console.error(
                    `Product sync failed (${response.status}):`,
                    message
                );

                return {
                    synced,
                    message: `The server rejected an operation (${response.status}). It remains queued.`
                };
            }

            if (operation === "create") {
                let result;

                try {
                    result = await response.json();
                } catch {
                    return {
                        synced,
                        message: "The server returned an invalid product response. The operation remains queued."
                    };
                }

                
const serverProduct =
    result.product ||
    result.productData ||
    result.data?.product ||
    result.data ||
    result;

                if (serverProduct.product_id == null) {
                    console.error("Unexpected product API response:", result);

                    return {
                        synced,
                        message: "The server response has no product ID. The operation remains queued."
                    };
                }

                completeLocalProductSync(
                    queuedItem.queue_id,
                    product.product_id,
                    serverProduct
                );
            } else {
                removeProductSyncQueueItem(queuedItem.queue_id);
            }

            synced += 1;
        }

        return {
            synced,
            message: `${synced} queued operation(s) synchronised successfully.`
        };
    } catch (error) {
        console.error("Product sync failed:", error);

        return {
            synced,
            message: "Product sync encountered an error. Remaining operations are still queued."
        };
    } finally {
        syncInProgress = false;
    }
}

module.exports = { syncPendingProducts };
