const PRODUCTS_API_URL = "http://localhost:5000/products";

async function createProduct(productData) {

    const response = await fetch(PRODUCTS_API_URL, {

        method: "POST",

        // IMPORTANT: DO NOT set headers
        body: productData // FormData goes here

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