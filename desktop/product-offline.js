
const { createLocalProduct } = require("./database/database.js");

function createOfflineProduct(product) {
    if (!product || typeof product !== "object") {
        throw new Error("Invalid product details.");
    }

    if (
        product.image_url &&
        !/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(product.image_url)
    ) {
        throw new Error("The offline product image format is invalid.");
    }

    if (
        product.image_url &&
        product.image_url.length > 7 * 1024 * 1024
    ) {
        throw new Error("The image is too large to save offline.");
    }

    return createLocalProduct(product);
}

module.exports = { createOfflineProduct };
