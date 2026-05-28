import { createProduct } from "../api/products.api.js";

// =========================
// ELEMENTS
// =========================
const addProductForm = document.getElementById("add-product-form");
const categorySelect = document.getElementById("category");

// =========================
// LOAD CATEGORIES
// =========================
async function loadCategories() {
    try {

        const res = await fetch("http://localhost:5000/categories");
        const categories = await res.json();

        // clear first option (optional safety)
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

// run immediately
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

    // ✅ IMAGE (OPTIONAL)
    const imageFile = document.getElementById("product-image").files[0];

    if (imageFile) {
        formData.append("image", imageFile);
    }

    try {

        const result = await fetch("http://localhost:5000/products", {
            method: "POST",
            body: formData
        });

        const data = await result.json();

        console.log("SERVER RESPONSE:", data);

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

document.getElementById("closeAddProductBtn").addEventListener("click", () => {
    window.location.href = "../index.html";
});