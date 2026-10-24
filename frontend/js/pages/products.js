import { API_BASE_URL } from "../config/api.js";
import { fetchProducts } from "../api/products.api.js";

console.log("LOADED PRODUCTS.JS FILE");

// =========================================================
// DOM ELEMENTS
// =========================================================

const categoryBar = document.getElementById("categoryBar");
const productsGrid = document.getElementById("productsGrid");
const searchInput = document.getElementById("searchInput");

const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");

const stockBtn = document.getElementById("stock-btn");
const stockMenu = document.getElementById("stock-menu");

const cart = document.getElementById("cart");
const cartHeader = document.getElementById("cart-header");
const cartBody = document.getElementById("cart-body");
const checkoutBtn = document.getElementById("checkout-btn");
const clearCartBtn = document.getElementById("clear-cart-btn");
const cartTotal = document.getElementById("cart-total");

// =========================================================
// STATE
// =========================================================

let cartItems = JSON.parse(localStorage.getItem("cart")) || [];
let products = [];
let categories = [];
let activeCategory = "ALL";

// =========================================================
// SAVE CART
// =========================================================

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cartItems));
}

// =========================================================
// INIT
// =========================================================

init();

async function init() {
    setupSidebar();
    setupStockDropdown();
    setupCartDragging();
    setupCartResizer();
    setupCartToggle();

    await loadProducts();
    await loadCategories();

    renderCart();
}

// =========================================================
// SIDEBAR
// =========================================================

function setupSidebar() {
    if (!menuBtn || !sidebar) return;

    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("active");
    });
}

// =========================================================
// STOCK MANAGEMENT DROPDOWN
// =========================================================

function setupStockDropdown() {
    if (!stockBtn || !stockMenu) return;

    stockBtn.addEventListener("click", () => {
        stockMenu.classList.toggle("open");

        const arrow = stockBtn.querySelector(".arrow");

        if (arrow) {
            arrow.textContent = stockMenu.classList.contains("open")
                ? "▲"
                : "▼";
        }
    });
}

// =========================================================
// LOAD PRODUCTS
// =========================================================

async function loadProducts() {
    productsGrid.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Loading products...</p>
        </div>
    `;

    try {
        products = await fetchProducts();
        renderProducts(products);
    } catch (error) {
        console.error("Failed to load products:", error);

        productsGrid.innerHTML = `
            <div class="products-message">
                Failed to load products.
            </div>
        `;
    }
}

// =========================================================
// LOAD CATEGORIES
// =========================================================

async function loadCategories() {
    try {
        const res = await fetch(`${API_BASE_URL}/categories`);

        if (!res.ok) {
            throw new Error("Failed to load categories");
        }

        categories = await res.json();

        renderCategories();
    } catch (error) {
        console.error("Failed to load categories:", error);
    }
}

// =========================================================
// RENDER CATEGORIES
// =========================================================

function renderCategories() {
    if (!categoryBar) return;

    categoryBar.innerHTML = "";

    // ALL PRODUCTS BUTTON

    const allButton = document.createElement("button");

    allButton.type = "button";
    allButton.classList.add("category-btn", "active");
    allButton.dataset.category = "ALL";
    allButton.textContent = "All Products";

    allButton.addEventListener("click", () => {
        activeCategory = "ALL";

        setActiveCategory(allButton);

        applyFilters();
    });

    categoryBar.appendChild(allButton);

    // CATEGORY BUTTONS

    categories.forEach(category => {
        const button = document.createElement("button");

        button.type = "button";
        button.classList.add("category-btn");

        button.dataset.category = category.category_name;
        button.textContent = category.category_name;

        button.addEventListener("click", () => {
            activeCategory = category.category_name;

            setActiveCategory(button);

            applyFilters();
        });

        categoryBar.appendChild(button);
    });
}

// =========================================================
// ACTIVE CATEGORY
// =========================================================

function setActiveCategory(selectedButton) {
    document
        .querySelectorAll("#categoryBar .category-btn")
        .forEach(button => {
            button.classList.remove("active");
        });

    selectedButton.classList.add("active");
}

// =========================================================
// SEARCH
// =========================================================

if (searchInput) {
    searchInput.addEventListener("input", () => {
        applyFilters();
    });
}

// =========================================================
// FILTER PRODUCTS
// =========================================================

function applyFilters() {
    const searchTerm = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    let filtered = [...products];

    if (activeCategory !== "ALL") {
        filtered = filtered.filter(
            product => product.category_name === activeCategory
        );
    }

    if (searchTerm) {
        filtered = filtered.filter(product => {
            const itemName = product.item_name?.toLowerCase() || "";
            const barcode = String(product.barcode || "");
            const category = product.category_name?.toLowerCase() || "";

            return (
                itemName.includes(searchTerm) ||
                barcode.includes(searchTerm) ||
                category.includes(searchTerm)
            );
        });
    }

    renderProducts(filtered);
}

// =========================================================
// RENDER PRODUCT CARDS
// =========================================================

function renderProducts(data) {
    productsGrid.innerHTML = "";

    if (!data || data.length === 0) {
        productsGrid.innerHTML = `
            <div class="products-message">
                No products found.
            </div>
        `;

        return;
    }

    data.forEach(product => {
        const card = document.createElement("div");

        card.classList.add("product-card");

        card.dataset.productId = product.product_id;
        card.dataset.barcode = product.barcode;

        // STOCK STATUS

        let stockClass = "stock-good";
        let stockText = "In Stock";

        if (product.quantity_in_stock <= 0) {
            stockClass = "stock-out";
            stockText = "Out of Stock";
        } else if (product.quantity_in_stock <= 5) {
            stockClass = "stock-low";
            stockText = "Low Stock";
        }

        // PRODUCT IMAGE

        let imageHTML = "";

        if (product.image_url) {
            imageHTML = `
                <img
                    src="${product.image_url}"
                    alt="${product.item_name}"
                    class="product-img"
                >
            `;
        } else {
            imageHTML = `
                <div class="no-image">
                    No Image
                </div>
            `;
        }

        // PRODUCT CARD

        card.innerHTML = `
            <div class="product-image-container">
                ${imageHTML}
            </div>

            <div class="product-card-body">

                <h3 class="product-title">
                    ${product.item_name}
                </h3>

                <p class="product-category">
                    ${product.category_name || "Unassigned"}
                </p>

                <div class="product-info">

                    <div class="info-row">
                        <span>Barcode</span>
                        <strong>
                            ${product.barcode || "-"}
                        </strong>
                    </div>

                    <div class="info-row">
                        <span>Size</span>
                        <strong>
                            ${product.item_size || "-"}
                        </strong>
                    </div>

                    <div class="info-row">
                        <span>Price</span>
                        <strong class="product-price">
                            R ${Number(product.price).toFixed(2)}
                        </strong>
                    </div>

                    <div class="info-row stock-row">
                        <span>Stock</span>

                        <strong class="${stockClass}">
                            ${product.quantity_in_stock}

                            <small>
                                ${stockText}
                            </small>
                        </strong>
                    </div>

                </div>

                <button
                    class="add-to-cart-btn"
                    data-product-id="${product.product_id}"
                    type="button"
                >
                    Add to Cart
                </button>

            </div>
        `;

        // ADD TO CART BUTTON

        const addButton = card.querySelector(".add-to-cart-btn");

        addButton.addEventListener("click", e => {
            e.stopPropagation();
            addProductToCart(product);
        });

        productsGrid.appendChild(card);
    });
}

// =========================================================
// ADD PRODUCT TO CART
// =========================================================

function addProductToCart(product) {
    if (!product) return;

    if (product.quantity_in_stock <= 0) {
        alert(`${product.item_name} is out of stock.`);
        return;
    }

    const existing = cartItems.find(
        item => item.barcode === product.barcode
    );

    if (existing) {
        if (existing.quantity >= product.quantity_in_stock) {
            alert(`Only ${product.quantity_in_stock} in stock.`);
            return;
        }

        existing.quantity++;

        existing.total = existing.quantity * existing.price;
    } else {
        cartItems.push({
            product_id: product.product_id,
            barcode: product.barcode,
            item_name: product.item_name,
            price: Number(product.price),
            quantity: 1,
            total: Number(product.price)
        });
    }

    saveCart();
    renderCart();

    // AUTOMATICALLY OPEN CART AFTER ADDING A PRODUCT

    const layout = document.querySelector(".products-layout");

    if (layout && layout.classList.contains("cart-hidden")) {
        const toggleBtn = document.getElementById("cart-toggle-btn");

        if (toggleBtn) {
            toggleBtn.click();
        }
    }
}

// =========================================================
// RENDER CART
// =========================================================

function renderCart() {
    if (!cartBody) return;

    cartBody.innerHTML = "";

    // CALCULATE CART TOTAL

    const total = cartItems.reduce(
        (sum, item) => sum + Number(item.total || 0),
        0
    );

    if (cartTotal) {
        cartTotal.textContent = `R ${total.toFixed(2)}`;
    }

    // EMPTY CART

    if (cartItems.length === 0) {
        cartBody.innerHTML = `
            <tr>
                <td
                    colspan="3"
                    style="
                        text-align:center;
                        padding:25px 10px;
                        color:#6b7280;
                    "
                >
                    Cart is empty
                </td>
            </tr>
        `;

        return;
    }

    // CART ITEMS

    cartItems.forEach(item => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                ${item.item_name}
            </td>

            <td>
                <input
                    type="number"
                    min="1"
                    value="${item.quantity}"
                    class="qty-input"
                    data-barcode="${item.barcode}"
                >
            </td>

            <td class="total-cell">
                R ${Number(item.total).toFixed(2)}
            </td>
        `;

        row.addEventListener("contextmenu", e => {
            e.preventDefault();

            if (confirm(`Remove "${item.item_name}"?`)) {
                cartItems = cartItems.filter(
                    c => c.barcode !== item.barcode
                );

                saveCart();
                renderCart();
            }
        });

        cartBody.appendChild(row);
    });

    attachQtyListeners();
}

// =========================================================
// CART QUANTITY
// =========================================================

function attachQtyListeners() {
    document.querySelectorAll(".qty-input").forEach(input => {
        input.addEventListener("input", e => {
            const barcode = e.target.dataset.barcode;

            let value = parseInt(e.target.value);

            if (isNaN(value) || value < 1) {
                value = 1;
            }

            const item = cartItems.find(
                c => c.barcode == barcode
            );

            if (!item) return;

            const product = products.find(
                p => p.barcode == barcode
            );

            if (!product) return;

            if (value > product.quantity_in_stock) {
                value = product.quantity_in_stock;
                e.target.value = value;

                alert(`Only ${product.quantity_in_stock} in stock.`);
            }

            item.quantity = value;
            item.total = item.price * value;

            saveCart();

            const totalCell = e.target
                .closest("tr")
                .querySelector(".total-cell");

            totalCell.textContent = `R ${item.total.toFixed(2)}`;

            // UPDATE OVERALL CART TOTAL

            const newCartTotal = cartItems.reduce(
                (sum, cartItem) =>
                    sum + Number(cartItem.total || 0),
                0
            );

            if (cartTotal) {
                cartTotal.textContent = `R ${newCartTotal.toFixed(2)}`;
            }
        });
    });
}

// =========================================================
// CHECKOUT
// =========================================================

if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
        if (cartItems.length === 0) {
            alert("Your cart is empty. Please add products before checkout.");
            return;
        }

        // TRANSFER CART ITEMS TO CHECKOUT

        localStorage.setItem(
            "checkoutCart",
            JSON.stringify(cartItems)
        );

        // CLEAR ORIGINAL CART

        cartItems = [];
        saveCart();
        renderCart();

        // NAVIGATE TO CHECKOUT

        window.location.href = "checkout.html";
    });
}

// =========================================================
// CLEAR CART
// =========================================================

if (clearCartBtn) {
    clearCartBtn.addEventListener("click", e => {
        e.stopPropagation();

        if (cartItems.length === 0) return;

        if (confirm("Clear all items from cart?")) {
            cartItems = [];

            saveCart();
            renderCart();
        }
    });
}

// =========================================================
// CART DRAGGING
// =========================================================

function setupCartDragging() {
    if (!cart || !cartHeader) {
        console.warn("Cart dragging elements not found.");
        return;
    }

    let dragging = false;
    let startX = 0;

    cartHeader.addEventListener("mousedown", e => {
        if (e.target.closest("button")) {
            return;
        }

        dragging = true;
        startX = e.clientX;

        cart.classList.add("dragging");
        cartHeader.style.cursor = "grabbing";

        e.preventDefault();
    });

    document.addEventListener("mousemove", e => {
        if (!dragging) return;

        const distance = e.clientX - startX;

        if (Math.abs(distance) < 80) {
            return;
        }

        if (distance < 0) {
            cart.classList.add("cart-left");
        } else {
            cart.classList.remove("cart-left");
        }
    });

    document.addEventListener("mouseup", () => {
        if (!dragging) return;

        dragging = false;

        cart.classList.remove("dragging");
        cartHeader.style.cursor = "grab";
    });
}

// =========================================================
// CART RESIZING HANDLE LOGIC
// =========================================================

function setupCartResizer() {
    const resizer = document.getElementById("cart-resizer");
    const cart = document.getElementById("cart");
    const mainContent = document.getElementById("main-content");

    if (!resizer || !cart || !mainContent) {
        return;
    }

    const initialWidth = 320;

    cart.style.width = `${initialWidth}px`;
    resizer.style.right = `${initialWidth}px`;
    mainContent.style.marginRight = `${initialWidth}px`;

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    const minCartWidth = 240;
    const maxCartWidth = window.innerWidth * 0.55;

    resizer.addEventListener("mousedown", e => {
        isResizing = true;

        startX = e.clientX;
        startWidth = cart.offsetWidth;

        resizer.classList.add("resizing");

        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", e => {
        if (!isResizing) return;

        const dx = startX - e.clientX;
        let newWidth = startWidth + dx;

        if (newWidth < minCartWidth) {
            newWidth = minCartWidth;
        }

        if (newWidth > maxCartWidth) {
            newWidth = maxCartWidth;
        }

        cart.style.width = `${newWidth}px`;
        resizer.style.right = `${newWidth}px`;
        mainContent.style.marginRight = `${newWidth}px`;
    });

    document.addEventListener("mouseup", () => {
        if (!isResizing) return;

        isResizing = false;

        resizer.classList.remove("resizing");

        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
    });
}

// =========================================================
// CART TOGGLE
// =========================================================

function setupCartToggle() {
    const layout = document.querySelector(".products-layout");
    const toggleBtn = document.getElementById("cart-toggle-btn");
    const cart = document.getElementById("cart");
    const resizer = document.getElementById("cart-resizer");
    const mainContent = document.getElementById("main-content");

    if (!layout || !toggleBtn || !cart || !mainContent) {
        console.error("Cart toggle: required elements were not found.");
        return;
    }

    // START WITH THE CART CLOSED WHEN THE PAGE OPENS

    layout.classList.add("cart-hidden");

    cart.style.display = "none";

    if (resizer) {
        resizer.style.display = "none";
    }

    mainContent.style.marginRight = "0";
    mainContent.style.width = "100%";

    toggleBtn.textContent = "<";
    toggleBtn.title = "Open cart";
    toggleBtn.setAttribute("aria-label", "Open cart");
    toggleBtn.setAttribute("aria-expanded", "false");

    // KEEP MANUAL OPEN/CLOSE FUNCTIONALITY

    toggleBtn.addEventListener("click", () => {
        const cartHidden = layout.classList.toggle("cart-hidden");

        if (cartHidden) {
            cart.style.display = "none";

            if (resizer) {
                resizer.style.display = "none";
            }

            mainContent.style.marginRight = "0";
            mainContent.style.width = "100%";

            toggleBtn.textContent = "<";
            toggleBtn.title = "Open cart";
            toggleBtn.setAttribute("aria-label", "Open cart");
            toggleBtn.setAttribute("aria-expanded", "false");
        } else {
            cart.style.display = "flex";

            if (resizer) {
                resizer.style.display = "block";
            }

            const cartWidth = cart.offsetWidth || 320;

            cart.style.width = `${cartWidth}px`;
            mainContent.style.marginRight = `${cartWidth}px`;
            mainContent.style.width = "";

            toggleBtn.textContent = ">";
            toggleBtn.title = "Close cart";
            toggleBtn.setAttribute("aria-label", "Close cart");
            toggleBtn.setAttribute("aria-expanded", "true");
        }
    });
}

// =========================================================
// BARCODE SCANNER
// =========================================================

let barcodeBuffer = "";
let barcodeTimeout = null;

document.addEventListener("keydown", e => {
    if (e.target === searchInput) {
        return;
    }

    if (e.key.length === 1 || e.key === "Enter") {
        e.preventDefault();
    }

    // ENTER = FINISH SCAN

    if (e.key === "Enter") {
        if (barcodeBuffer.length > 0) {
            console.log("SCANNED BARCODE:", barcodeBuffer);

            const product = products.find(
                p => String(p.barcode) === barcodeBuffer
            );

            if (product) {
                addProductToCart(product);
            } else {
                alert(`Product with barcode ${barcodeBuffer} not found.`);
            }

            barcodeBuffer = "";
        }

        clearTimeout(barcodeTimeout);
        return;
    }

    // BUILD BARCODE

    if (e.key.length === 1) {
        barcodeBuffer += e.key;
    }

    clearTimeout(barcodeTimeout);

    barcodeTimeout = setTimeout(() => {
        barcodeBuffer = "";
    }, 500);
});
