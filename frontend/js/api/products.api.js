const API_BASE_URL = "https://liquorstore-api.onrender.com";

const PRODUCTS_API_URL = `${API_BASE_URL}/products`;

async function createProduct(productData) {
    const response = await fetch(PRODUCTS_API_URL, {
        method: "POST",
        body: productData
    });

    return response.json();
}

async function fetchProducts() {
    const response = await fetch(PRODUCTS_API_URL);
    return response.json();
}

export {
    createProduct,
    fetchProducts
};