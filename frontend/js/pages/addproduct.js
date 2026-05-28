import { createProduct } from "../api/products.api.js";

// =========================
// BASE URL
// =========================
const API_BASE_URL = "https://liquorstore-api.onrender.com";

// =========================
// ELEMENTS
// =========================
const addProductForm = document.getElementById("add-product-form");
const categorySelect = document.getElementById("category");

// =========================
// LOAD CATEGORIES FROM BACKEND
// =========================
async function loadCategories() {
    try {
        const res = await fetch(`${API_BASE_URL}/categories`);
        const categories = await res.json();

        categorySelect.innerHTML = `<option value="">Select Category</option>`;

        categories.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat.category_id;
            option.textContent = cat.category_name;
            categorySelect.appendChild(option);
        });

    } catch (error) {
        console.error("CATEGORY LOAD ERROR:", error);
    }
}

loadCategories();

// =========================
// SUBMIT PRODUCT
// =========================
addProductForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const formData = new FormData();

    formData.append("item_name", document.getElementById("item-name").value);
    formData.append("item_size", document.getElementById("item-size").value);
    formData.append("barcode", document.getElementById("barcode").value);
    formData.append("category_id", categorySelect.value);
    formData.append("quantity_in_stock", document.getElementById("quantity-in-stock").value);
    formData.append("price", document.getElementById("price").value);

    const imageFile = document.getElementById("product-image").files[0];

    if (imageFile) {
        formData.append("image", imageFile);
    }

    try {
        const result = await fetch(`${API_BASE_URL}/products`, {
            method: "POST",
            body: formData
        });

        const data = await result.json();

        if (!result.ok) {
            throw new Error(data.error || "Failed to save product");
        }

        alert("Product saved successfully");
        addProductForm.reset();

    } catch (error) {
        console.error("SAVE PRODUCT ERROR:", error.message);
        alert("Failed to save product: " + error.message);
    }
});

// =========================
// CLOSE BUTTON
// =========================
document.getElementById("closeAddProductBtn").addEventListener("click", () => {
    window.location.href = "../index.html";
});