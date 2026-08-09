const API_BASE_URL = "https://liquorstore-api.onrender.com";

// =========================
// SIDEBAR ELEMENTS
// =========================
const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");

const searchInput = document.getElementById("inventory-search");
const closeBtn = document.getElementById("closeInventoryBtn");

let allProducts = [];
let categories = [];

// =========================
// INIT
// =========================
async function init() {

    setupSidebar();

    await Promise.all([
        loadInventory(),
        loadCategories()
    ]);

}

init();

// =========================
// SIDEBAR
// =========================
function setupSidebar() {

    if (!menuBtn || !sidebar) return;

    menuBtn.addEventListener("click", () => {

        sidebar.classList.toggle("active");

    });

}

// =========================
// LOAD INVENTORY
// =========================
async function loadInventory() {

    try {

        const res =
            await fetch(`${API_BASE_URL}/products`);

        allProducts =
            await res.json();

        renderCards(allProducts);

    } catch (error) {

        console.error(
            "INVENTORY LOAD ERROR:",
            error
        );

    }

}

// =========================
// LOAD CATEGORIES
// =========================
async function loadCategories() {

    try {

        const response =
            await fetch(`${API_BASE_URL}/categories`);

        categories =
            await response.json();

        renderCategories();

    } catch (error) {

        console.error(
            "CATEGORY LOAD ERROR:",
            error
        );

    }

}

// =========================
// RENDER SIDEBAR CATEGORIES
// =========================
function renderCategories() {

    const list =
        document.getElementById("category-list");

    list.innerHTML = "";

    // =========================
    // ALL PRODUCTS
    // =========================

    const allItem =
        document.createElement("li");

    allItem.innerHTML = `
        <button class="sidebar-btn active">
            All Products
        </button>
    `;

    allItem
        .querySelector("button")
        .addEventListener("click", () => {

            setActiveButton(
                allItem.querySelector("button")
            );

            renderCards(allProducts);

        });

    list.appendChild(allItem);

    // =========================
    // DATABASE CATEGORIES
    // =========================

    categories.forEach(category => {

        const li =
            document.createElement("li");

        li.innerHTML = `
            <button class="sidebar-btn">
                ${category.category_name}
            </button>
        `;

        li.querySelector("button")
            .addEventListener("click", () => {

                setActiveButton(
                    li.querySelector("button")
                );

                filterCategory(
                    category.category_name
                );

            });

        list.appendChild(li);

    });

}

// =========================
// ACTIVE SIDEBAR BUTTON
// =========================
function setActiveButton(button) {

    document
        .querySelectorAll(".sidebar-btn")
        .forEach(btn =>
            btn.classList.remove("active")
        );

    button.classList.add("active");

}

// =========================
// SEARCH
// =========================
searchInput.addEventListener("input", () => {

    const searchTerm =
        searchInput.value
            .trim()
            .toLowerCase();

    const filtered =
        allProducts.filter(product =>

            product.item_name
                ?.toLowerCase()
                .includes(searchTerm)

            ||

            String(product.barcode)
                .includes(searchTerm)

            ||

            product.category_name
                ?.toLowerCase()
                .includes(searchTerm)

        );

    renderCards(filtered);

});

// =========================
// FILTER CATEGORY
// =========================
function filterCategory(categoryName) {

    if (categoryName === "ALL") {

        renderCards(allProducts);

        return;

    }

    const filtered =
        allProducts.filter(product =>
            product.category_name === categoryName
        );

    renderCards(filtered);

}

// =========================
// RENDER PRODUCT CARDS
// =========================
function renderCards(products) {

    const container =
        document.getElementById("inventory-grid");

    container.innerHTML = "";

    if (products.length === 0) {

        container.innerHTML = `
            <p>No products found.</p>
        `;

        return;

    }

    products.forEach(product => {

        const card =
            document.createElement("div");

        card.classList.add("product-card");

        // =========================
        // CLOUDINARY IMAGE
        // =========================

        const imageUrl =
            product.image_url ||
            "./logoimage/noimageavilable.jpeg";

        // =========================
        // STOCK COLOR
        // =========================

        let stockColor = "#16a34a";

        if (product.quantity_in_stock <= 0) {

            stockColor = "#dc2626";

        } else if (product.quantity_in_stock <= 5) {

            stockColor = "#f59e0b";

        }

        // =========================
        // CARD HTML
        // =========================

        card.innerHTML = `

            <div class="product-image-container">

                <img
                    src="${imageUrl}"
                    alt="${product.item_name}"
                    class="product-img"
                >

            </div>

            <h3 class="product-title">
                ${product.item_name}
            </h3>

            <div class="product-details">

                <p>
                    <span class="detail-label">
                        Barcode:
                    </span>

                    <span class="detail-value">
                        ${product.barcode}
                    </span>
                </p>

                <p>
                    <span class="detail-label">
                        Category:
                    </span>

                    <span class="detail-value">
                        ${product.category_name || "Unassigned"}
                    </span>
                </p>

                <p>
                    <span class="detail-label">
                        Price:
                    </span>

                    <span class="detail-value">
                        R ${Number(product.price).toFixed(2)}
                    </span>
                </p>

                <p>
                    <span class="detail-label">
                        Stock:
                    </span>

                    <span
                        class="detail-value"
                        style="
                            color: ${stockColor};
                            font-weight: 600;
                        "
                    >
                        ${product.quantity_in_stock}
                    </span>
                </p>

            </div>

        `;

        // =========================
        // IMAGE MODAL
        // =========================

        const image =
            card.querySelector(".product-img");

        image.addEventListener("click", () => {

            openImageModal(
                imageUrl,
                product.item_name
            );

        });

        container.appendChild(card);

    });

}

// =========================
// IMAGE MODAL
// =========================
function openImageModal(imageUrl, title) {

    let modal =
        document.getElementById("image-modal");

    if (!modal) {

        modal =
            document.createElement("div");

        modal.id = "image-modal";

        modal.innerHTML = `

            <div class="modal-backdrop"></div>

            <div class="modal-content">

                <img
                    id="modal-img"
                    src=""
                    alt=""
                >

                <p id="modal-title"></p>

            </div>

        `;

        document.body.appendChild(modal);

        modal
            .querySelector(".modal-backdrop")
            .addEventListener("click", () => {

                modal.style.display = "none";

            });

    }

    document.getElementById("modal-img").src =
        imageUrl;

    document.getElementById("modal-title")
        .textContent = title;

    modal.style.display = "flex";

}

// =========================
// CLOSE PAGE
// =========================
closeBtn.addEventListener("click", () => {

    window.location.href = "index.html";

});
