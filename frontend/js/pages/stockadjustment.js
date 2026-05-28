import { API_BASE_URL } from "../config/api.js";

let products = [];
let categories = [];
let changedRows = new Set();

const tbody = document.getElementById("stock-body");
const saveBtn = document.getElementById("save-all");

// =========================
// LOAD PRODUCTS
// =========================
async function loadProducts() {

    try {
        const res = await fetch(`${API_BASE_URL}/products`);
        products = await res.json();

        tbody.innerHTML = "";

        products.forEach(p => {

            const row = document.createElement("tr");
            row.dataset.id = p.product_id;

            // FIX: remove localhost dependency
            const imageUrl = p.image_url
                ? `${API_BASE_URL}${p.image_url}`
                : "https://placehold.co/100x100?text=No+Image";

            row.innerHTML = `
                <td>
                    <input value="${p.item_name}" data-id="${p.product_id}" class="name-input">
                </td>

                <td>
                    <input value="${p.barcode}" data-id="${p.product_id}" class="barcode-input">
                </td>

                <td class="category-cell" data-id="${p.product_id}">
                    ${p.category_name}
                </td>

                <td>
                    <input type="number" value="${p.quantity_in_stock}" data-id="${p.product_id}" class="stock-input">
                </td>

                <td>
                    <input type="number" value="${p.price}" data-id="${p.product_id}" class="price-input">
                </td>

                <td>
                    <img src="${imageUrl}" class="stock-image">

                    <input 
                        type="file"
                        class="image-input"
                        data-id="${p.product_id}"
                        accept="image/*"
                    >
                </td>
            `;

            tbody.appendChild(row);
        });

    } catch (error) {
        console.error("LOAD PRODUCTS ERROR:", error);
    }
}

// =========================
// LOAD CATEGORIES
// =========================
async function loadCategories() {
    try {
        const res = await fetch(`${API_BASE_URL}/categories`);
        categories = await res.json();
    } catch (error) {
        console.error("LOAD CATEGORIES ERROR:", error);
    }
}

loadCategories();
loadProducts();

// =========================
// TRACK CHANGES
// =========================
tbody.addEventListener("input", (e) => {
    const input = e.target;
    if (input.dataset.id) {
        changedRows.add(input.dataset.id);
    }
});

// =========================
// SAVE ALL CHANGES
// =========================
saveBtn.addEventListener("click", async () => {

    if (changedRows.size === 0) {
        alert("No changes made");
        return;
    }

    for (const id of changedRows) {

        const p = products.find(x => x.product_id == id);
        if (!p) continue;

        const nameInput = document.querySelector(`.name-input[data-id="${id}"]`);
        const barcodeInput = document.querySelector(`.barcode-input[data-id="${id}"]`);
        const stockInput = document.querySelector(`.stock-input[data-id="${id}"]`);
        const priceInput = document.querySelector(`.price-input[data-id="${id}"]`);
        const categoryCell = document.querySelector(`.category-cell[data-id="${id}"]`);

        const formData = new FormData();

        formData.append("item_name", nameInput.value);
        formData.append("item_size", p.item_size);
        formData.append("barcode", barcodeInput.value);
        formData.append("category_id", categoryCell.dataset.newCategory || p.category_id);
        formData.append("quantity_in_stock", Number(stockInput.value));
        formData.append("price", Number(priceInput.value));

        const imageInput = document.querySelector(`.image-input[data-id="${id}"]`);

        if (imageInput.files[0]) {
            formData.append("image", imageInput.files[0]);
        }

        await fetch(`${API_BASE_URL}/products/${id}`, {
            method: "PUT",
            body: formData
        });
    }

    alert("Only changed rows saved!");
    changedRows.clear();
    loadProducts();
});

// =========================
// CONTEXT MENU
// =========================
const contextMenu = document.getElementById("context-menu");
const deleteRowOption = document.getElementById("delete-row-option");
const deleteImageOption = document.getElementById("delete-image-option");

let selectedProductId = null;

// RIGHT CLICK EVENT
tbody.addEventListener("contextmenu", (e) => {

    e.preventDefault();

    const row = e.target.closest("tr");
    if (!row) return;

    document.querySelectorAll("#stock-body tr").forEach(r => {
        r.classList.remove("selected-row");
    });

    row.classList.add("selected-row");

    selectedProductId = row.dataset.id;

    const clickedImage = e.target.classList.contains("stock-image");

    deleteImageOption.style.display = clickedImage ? "block" : "none";

    contextMenu.style.display = "flex";
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.top = `${e.pageY}px`;
});

// CLOSE MENU
document.addEventListener("click", () => {
    contextMenu.style.display = "none";
});

// =========================
// DELETE PRODUCT (FIXED BUG HERE)
// =========================
deleteRowOption.addEventListener("click", async () => {

    const confirmDelete = confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    await fetch(`${API_BASE_URL}/products/${selectedProductId}`, {
        method: "DELETE"
    });

    loadProducts();
});

// =========================
// DELETE IMAGE
// =========================
deleteImageOption.addEventListener("click", async () => {

    const confirmDelete = confirm("Delete only this image?");
    if (!confirmDelete) return;

    await fetch(`${API_BASE_URL}/products/${selectedProductId}/image`, {
        method: "DELETE"
    });

    loadProducts();
});

// =========================
// CLOSE PAGE
// =========================
const closeBtn = document.getElementById("closeStockAdjustmentBtn");

closeBtn.addEventListener("click", () => {

    if (changedRows.size === 0) {
        window.location.href = "../index.html";
        return;
    }

    const confirmClose = confirm(
        "You have unsaved changes. Are you sure you want to leave without saving?"
    );

    if (confirmClose) {
        window.location.href = "../index.html";
    }
});