
const API_BASE_URL = "https://liquorstore-api.onrender.com";

const PRODUCTS_API_URL = `${API_BASE_URL}/products`;

async function createProduct(productData) {
    const response = await fetch(PRODUCTS_API_URL, {
        method: "POST",
        body: productData
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to create product.");
    }

    return data;
}

async function fetchProducts() {
    try {
        // 1. Try to fetch products from the online backend.
        const response = await fetch(PRODUCTS_API_URL);

        if (!response.ok) {
            throw new Error("Unable to fetch products from the server.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("The server did not return a product array.");
        }

        // 2. Save the online products to the local SQLite database.
        if (window.posDatabase) {
            await window.posDatabase.saveProducts(data);
            console.log("Products saved to local database:", data.length);
        }

        // 3. Return the online products to the existing POS.
        return data;

    } catch (error) {
        console.warn(
            "Online product fetch failed. Trying local cache:",
            error.message
        );

        // 4. If offline, load products from the local database.
        if (window.posDatabase) {
            const cachedProducts = await window.posDatabase.getProducts();

            if (cachedProducts.length > 0) {
                console.log(
                    "Products loaded from local database:",
                    cachedProducts.length
                );

                return cachedProducts;
            }
        }

        // 5. If no cached products exist, explain the problem.
        throw new Error(
            "Products could not be loaded. Connect to the internet to download and cache products before using the POS offline."
        );
    }
}

export {
    createProduct,
    fetchProducts
};
