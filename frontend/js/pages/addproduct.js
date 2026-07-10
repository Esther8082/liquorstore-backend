import { createProduct } from "../api/products.api.js";

// =========================
// BASE URL
// =========================
const API_BASE_URL = "https://liquorstore-api.onrender.com";

// =========================
// ELEMENTS
// =========================
const addProductForm = document.getElementById("add-product-form");
const categoryGrid =
    document.getElementById("category-grid");

const selectedCategory =
    document.getElementById("selected-category");

const productFormSection =
    document.getElementById("product-form-section");
    
const categoryModal =
    document.getElementById("category-modal");

const newCategoryBtn =
    document.getElementById("new-category-btn");

const cancelCategoryBtn =
    document.getElementById("cancel-category-btn");

const saveCategoryBtn =
    document.getElementById("save-category-btn");

const newCategoryInput =
    document.getElementById("new-category-name");

let selectedCategoryId = null;

// =========================
// LOAD CATEGORIES FROM BACKEND
// =========================
async function loadCategories() {

    try {

        const response =
            await fetch(`${API_BASE_URL}/categories`);

        const categories =
            await response.json();

        categoryGrid.innerHTML = "";

        categories.forEach(category => {

            const card =
                document.createElement("div");

            card.className = "category-card";

            card.textContent =
                category.category_name;

            card.dataset.id =
                category.category_id;

            card.dataset.name =
                category.category_name;

            card.addEventListener("click", () => {

    document
        .querySelectorAll(".category-card")
        .forEach(c => c.classList.remove("selected"));

    card.classList.add("selected");

    selectedCategoryId =
        category.category_id;

    selectedCategory.textContent =
        category.category_name;

    // Show the product form
    productFormSection.classList.add("show");

    // Scroll to the form
    productFormSection.scrollIntoView({

        behavior: "smooth",
        block: "start"

    });

});

      categoryGrid.appendChild(card);

        });

    }

    catch(error){

        console.error(error);

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
    if(!selectedCategoryId){

    alert("Please choose a category.");

    return;

}

formData.append(
    "category_id",
    selectedCategoryId
);

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

selectedCategory.textContent = "None";

selectedCategoryId = null;

productFormSection.classList.remove("show");

document
    .querySelectorAll(".category-card")
    .forEach(card => card.classList.remove("selected"));

window.scrollTo({

    top: 0,
    behavior: "smooth"

});

    } catch (error) {
        console.error("SAVE PRODUCT ERROR:", error.message);
        alert("Failed to save product: " + error.message);
    }
});
newCategoryBtn.addEventListener("click", () => {

    newCategoryInput.value = "";

    categoryModal.classList.add("show");

    newCategoryInput.focus();

});

cancelCategoryBtn.addEventListener("click", () => {

    categoryModal.classList.remove("show");

});

saveCategoryBtn.addEventListener("click", async () => {

    const categoryName =
        newCategoryInput.value.trim();

    if(categoryName === ""){

        alert("Enter a category name.");

        return;

    }

    try{

        const response = await fetch(
            `${API_BASE_URL}/categories`,
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    category_name:categoryName
                })
            }
        );

        const newCategory =
            await response.json();

        if(!response.ok){

            throw new Error(
                newCategory.error
            );

        }

        categoryModal.classList.remove("show");

        await loadCategories();

        document
        .querySelectorAll(".category-card")
        .forEach(card=>{

            if(
                Number(card.dataset.id) ===
                newCategory.category_id
            ){

                card.click();

            }

        });

    }

    catch(error){

        alert(error.message);

    }

});
// =========================
// CLOSE BUTTON
// =========================
document.getElementById("closeAddProductBtn").addEventListener("click", () => {
    window.location.href = "../index.html";
});