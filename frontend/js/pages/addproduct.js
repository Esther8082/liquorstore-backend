
import { createProduct } from "../api/products.api.js";

// =========================================================
// BASE URL
// =========================================================

const API_BASE_URL = "https://liquorstore-api.onrender.com";

// =========================================================
// ELEMENTS
// =========================================================

const addProductForm = document.getElementById("add-product-form");
const categoryGrid = document.getElementById("category-grid");
const selectedCategory = document.getElementById("selected-category");
const productFormSection = document.getElementById("product-form-section");
const categoryModal = document.getElementById("category-modal");
const newCategoryBtn = document.getElementById("new-category-btn");
const cancelCategoryBtn = document.getElementById("cancel-category-btn");
const saveCategoryBtn = document.getElementById("save-category-btn");
const newCategoryInput = document.getElementById("new-category-name");
const closeAddProductBtn = document.getElementById("closeAddProductBtn");

let selectedCategoryId = null;

// =========================================================
// CHECK SQLITE AVAILABILITY
// =========================================================

function hasLocalDatabase(methodName) {
    return (
        typeof window !== "undefined" &&
        window.posDatabase &&
        typeof window.posDatabase[methodName] === "function"
    );
}

// =========================================================
// READ FORM VALUES
// =========================================================

function getFormValue(fieldId) {
    const field = document.getElementById(fieldId);

    if (!field) {
        throw new Error(`Could not find the form field: ${fieldId}`);
    }

    return field.value.trim();
}

// =========================================================
// RESET PRODUCT FORM
// =========================================================

function resetProductForm() {
    addProductForm.reset();

    selectedCategory.textContent = "None";
    selectedCategoryId = null;

    productFormSection.classList.remove("show");

    document.querySelectorAll(".category-card").forEach(card => {
        card.classList.remove("selected");
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// =========================================================
// LOAD CATEGORIES
// ONLINE FIRST, SQLITE FALLBACK
// =========================================================

async function loadCategories() {
    try {
        let categories = [];

        // Try the online API first.
        try {
            const response = await fetch(`${API_BASE_URL}/categories`);

            if (!response.ok) {
                throw new Error(
                    `Categories API returned status ${response.status}`
                );
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error("Invalid categories API response.");
            }

            categories = data;

            // Cache online categories only if SQLite is available.
            if (hasLocalDatabase("saveCategories")) {
                try {
                    await window.posDatabase.saveCategories(categories);
                } catch (cacheError) {
                    console.warn(
                        "Categories loaded online but could not be cached:",
                        cacheError.message
                    );
                }
            }
        } catch (onlineError) {
            console.warn(
                "Unable to load online categories:",
                onlineError.message
            );

            // Fall back to SQLite in Electron.
            if (hasLocalDatabase("getCategories")) {
                categories = await window.posDatabase.getCategories();
            } else {
                throw new Error(
                    "Unable to load categories online. " +
                    "Please check your internet connection."
                );
            }
        }

        // Display categories.
        categoryGrid.innerHTML = "";

        categories.forEach(category => {
            const card = document.createElement("div");

            card.className = "category-card";
            card.textContent = category.category_name;
            card.dataset.id = category.category_id;
            card.dataset.name = category.category_name;

            card.addEventListener("click", () => {
                document.querySelectorAll(".category-card").forEach(item => {
                    item.classList.remove("selected");
                });

                card.classList.add("selected");

                selectedCategoryId = category.category_id;
                selectedCategory.textContent = category.category_name;

                productFormSection.classList.add("show");

                productFormSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            });

            categoryGrid.appendChild(card);
        });

        if (categories.length === 0) {
            categoryGrid.textContent = "No categories found.";
        }
    } catch (error) {
        console.error("LOAD CATEGORIES ERROR:", error);

        categoryGrid.textContent =
            "Could not load categories. Please check your internet connection.";
    }
}

// Load categories when the page opens.
loadCategories();

// =========================================================
// READ PRODUCT IMAGE
// =========================================================

function readImageAsDataUrl(file) {
    if (!file) {
        return Promise.resolve(null);
    }

    if (!file.type.startsWith("image/")) {
        return Promise.reject(
            new Error("Please select a valid image file.")
        );
    }

    const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

    if (file.size > MAX_IMAGE_SIZE) {
        return Promise.reject(
            new Error("Please choose an image smaller than 5 MB.")
        );
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.onerror = () => {
            reject(new Error("The selected image could not be read."));
        };

        reader.readAsDataURL(file);
    });
}

// =========================================================
// SAVE PRODUCT
// ONLINE FIRST, SQLITE IF OFFLINE
// =========================================================

addProductForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!selectedCategoryId) {
        alert("Please select a category first.");
        return;
    }

    const submitButton = addProductForm.querySelector(
        'button[type="submit"]'
    );

    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        // Read image.
        const imageInput = document.getElementById("product-image");
        const imageFile = imageInput?.files?.[0] || null;

        const imageDataUrl = await readImageAsDataUrl(imageFile);

        // Read product details.
        const product = {
            item_name: getFormValue("item-name"),
            item_size: getFormValue("item-size"),
            barcode: getFormValue("barcode"),
            category_id: Number(selectedCategoryId),
            category_name: selectedCategory.textContent.trim(),
            quantity_in_stock: Number(
                getFormValue("quantity-in-stock")
            ),
            price: Number(getFormValue("price"))
        };

        // Validate product details.
        if (!product.item_name) {
            throw new Error("Please enter a product name.");
        }

        if (!product.item_size) {
            throw new Error("Please enter the product size.");
        }

        if (!Number.isFinite(product.price) || product.price < 0) {
            throw new Error("Please enter a valid selling price.");
        }

        if (
            !Number.isInteger(product.quantity_in_stock) ||
            product.quantity_in_stock < 0
        ) {
            throw new Error(
                "Please enter a valid whole-number stock quantity."
            );
        }

        // Prepare request.
        const formData = new FormData();

        formData.append("item_name", product.item_name);
        formData.append("item_size", product.item_size);
        formData.append("barcode", product.barcode);
        formData.append("category_id", String(product.category_id));
        formData.append(
            "quantity_in_stock",
            String(product.quantity_in_stock)
        );
        formData.append("price", String(product.price));

        if (imageFile) {
            formData.append("image", imageFile);
        }

        // Attempt to save online.
        let response;

        try {
            response = await fetch(`${API_BASE_URL}/products`, {
                method: "POST",
                body: formData
            });
        } catch (networkError) {
            console.warn(
                "Online product creation failed:",
                networkError.message
            );

            // Offline saving is supported only when Electron exposes SQLite.
            if (!hasLocalDatabase("createLocalProduct")) {
                throw new Error(
                    "Could not connect to the online server. " +
                    "Offline product storage is only available in the " +
                    "Electron desktop app."
                );
            }

            const localProduct =
                await window.posDatabase.createLocalProduct({
                    ...product,
                    image_url: imageDataUrl
                });

            alert(
                `Product saved offline: ${localProduct.item_name}\n\n` +
                "The product will need to synchronise when the internet " +
                "is available."
            );

            resetProductForm();
            return;
        }

        // Handle HTTP/server errors.
        if (!response.ok) {
            const errorText = await response.text().catch(() => "");

            throw new Error(
                `The server could not create the product ` +
                `(${response.status}). ${errorText.slice(0, 250)}`
            );
        }

        // Read the created product.
        const result = await response.json();

        const serverProduct =
            result.product ||
            result.data?.product ||
            result;

        // Cache product only if SQLite is available.
        if (
            serverProduct.product_id != null &&
            hasLocalDatabase("saveProducts")
        ) {
            try {
                await window.posDatabase.saveProducts([serverProduct]);
            } catch (cacheError) {
                console.warn(
                    "Product was created online but could not be cached:",
                    cacheError.message
                );
            }
        }

        alert("Product added successfully.");

        resetProductForm();
    } catch (error) {
        console.error("ADD PRODUCT ERROR:", error);

        alert(error.message || "Could not save the product.");
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
});

// =========================================================
// OPEN CATEGORY MODAL
// =========================================================

newCategoryBtn.addEventListener("click", () => {
    newCategoryInput.value = "";
    categoryModal.classList.add("show");
    newCategoryInput.focus();
});

// =========================================================
// CANCEL CATEGORY CREATION
// =========================================================

cancelCategoryBtn.addEventListener("click", () => {
    categoryModal.classList.remove("show");
});

// =========================================================
// CREATE CATEGORY ONLINE
// =========================================================

saveCategoryBtn.addEventListener("click", async () => {
    const categoryName = newCategoryInput.value.trim();

    if (!categoryName) {
        alert("Enter a category name.");
        return;
    }

    saveCategoryBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                category_name: categoryName
            })
        });

        const newCategory = await response.json();

        if (!response.ok) {
            throw new Error(
                newCategory.error || "Failed to create category."
            );
        }

        categoryModal.classList.remove("show");

        // Refresh the category cards.
        await loadCategories();

        // Select the newly created category.
        document.querySelectorAll(".category-card").forEach(card => {
            if (
                Number(card.dataset.id) ===
                Number(newCategory.category_id)
            ) {
                card.click();
            }
        });
    } catch (error) {
        console.error("SAVE CATEGORY ERROR:", error);

        alert(
            "Could not create category. New categories currently " +
            "require an internet connection. " +
            error.message
        );
    } finally {
        saveCategoryBtn.disabled = false;
    }
});

// =========================================================
// CLOSE BUTTON
// =========================================================

closeAddProductBtn.addEventListener("click", () => {
    window.location.href = "../index.html";
});
