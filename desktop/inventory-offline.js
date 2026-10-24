
const {
    getCachedProducts,
    saveCachedProducts
} = require("./database/database.js");

const API_URL = "https://liquorstore-api.onrender.com/products";

async function getInventoryProducts() {
    try {
        // Fetch the latest products while online.
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }

        const products = await response.json();

        if (!Array.isArray(products)) {
            throw new Error("Invalid products response.");
        }

        // Save the latest products in the existing SQLite database.
        saveCachedProducts(products);

        return {
            products,
            source: "online"
        };
    } catch (error) {
        console.warn(
            "Inventory: API unavailable. Loading cached products.",
            error
        );

        // Fall back to the existing SQLite cache.
        const products = getCachedProducts();

        return {
            products,
            source: "offline"
        };
    }
}

module.exports = {
    getInventoryProducts
};
