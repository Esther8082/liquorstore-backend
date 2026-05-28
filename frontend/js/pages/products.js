import { API_BASE_URL } from "../config/api.js";

console.log("LOADED PRODUCTS.JS FILE");

import { fetchProducts } from "../api/products.api.js";

// =========================
// DOM ELEMENTS
// =========================
const categoryList = document.getElementById("categoryList");
const tbody = document.getElementById("productsTableBody");
const searchInput = document.getElementById("searchInput");

const cartBox = document.getElementById("cart");
const cartHeader = document.getElementById("cart-header");
const cartBody = document.getElementById("cart-body");

const checkoutBtn = document.getElementById("checkout-btn");
const backBtn = document.getElementById("backBtn");

// =========================
// STATE (PRODUCT PAGE CART)
// =========================
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let products = [];
let categories = [];
let activeCategory = "ALL";

// =========================
// SAVE CART
// =========================
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// =========================
// INIT
// =========================
init();

async function init() {
    await loadProducts();
    await loadCategories();

    renderProducts(products);
    renderCart();
}

// =========================
// LOAD PRODUCTS
// =========================
async function loadProducts() {
    try {
        tbody.innerHTML = `<tr><td colspan="7">Loading products...</td></tr>`;
        products = await fetchProducts();
        renderProducts(products);
    } catch (error) {
        console.error("Failed to load products:", error);
        tbody.innerHTML = `<tr><td colspan="7">Failed to load products</td></tr>`;
    }
}

// =========================
// LOAD CATEGORIES
// =========================
async function loadCategories() {
    try {
       const res = await fetch(`${API_BASE_URL}/categories`);        categories = await res.json();
        renderCategories();
    } catch (error) {
        console.error("Failed to load categories:", error);
    }
}

// =========================
// RENDER CATEGORIES
// =========================
function renderCategories() {
    categoryList.innerHTML = "";

    const allLi = document.createElement("li");
    allLi.textContent = "All Products";
    allLi.classList.add("active");

    allLi.addEventListener("click", () => {
        activeCategory = "ALL";
        setActive(allLi);
        renderProducts(products);
    });

    categoryList.appendChild(allLi);

    categories.forEach(cat => {
        const li = document.createElement("li");
        li.textContent = cat.category_name;

        li.addEventListener("click", () => {
            activeCategory = cat.category_name;
            setActive(li);

            const filtered = products.filter(
                p => p.category_name === cat.category_name
            );

            renderProducts(filtered);
        });

        categoryList.appendChild(li);
    });
}

// =========================
// ACTIVE CATEGORY UI
// =========================
function setActive(selected) {
    document.querySelectorAll("#categoryList li")
        .forEach(li => li.classList.remove("active"));

    selected.classList.add("active");
}

// =========================
// SEARCH
// =========================
searchInput.addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase();

    let filtered = products;

    if (activeCategory !== "ALL") {
        filtered = filtered.filter(
            p => p.category_name === activeCategory
        );
    }

    filtered = filtered.filter(p =>
        p.item_name.toLowerCase().includes(value) ||
        p.barcode.toString().includes(value)
    );

    renderProducts(filtered);
});

// =========================
// RENDER PRODUCTS
// =========================
function renderProducts(data) {
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">No products found</td></tr>`;
        return;
    }

    data.forEach(p => {
        const row = document.createElement("tr");
        row.dataset.barcode = p.barcode;

        row.innerHTML = `
            <td>${p.barcode}</td>
            <td>${p.item_name}</td>
            <td>${p.category_name}</td>
            <td>${p.item_size}</td>
            <td>R ${p.price}</td>
            <td>${p.quantity_in_stock}</td>
            <td>${p.quantity_in_stock > 0 ? "In Stock" : "Out of Stock"}</td>
        `;

        tbody.appendChild(row);
    });
}

// =========================
// ADD TO CART
// =========================
tbody.addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;

    const barcode = row.dataset.barcode;
    const product = products.find(
        p => p.barcode.toString() === barcode
    );

    if (!product) return;

    const existing = cart.find(
        item => item.barcode === product.barcode
    );

    if (existing) {
        existing.quantity++;
        existing.total = existing.quantity * existing.price;
    } else {
        cart.push({
            barcode: product.barcode,
            item_name: product.item_name,
            price: product.price,
            quantity: 1,
            total: product.price
        });
    }

    saveCart();
    renderCart();
});

// =========================
// RENDER CART
// =========================
function renderCart() {
    if (!cartBody) return;

    cartBody.innerHTML = "";

    cart.forEach((item, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.item_name}</td>
            <td>
                <input type="number" min="1" value="${item.quantity}" class="qty-input"/>
            </td>
            <td>R ${item.total}</td>
        `;

        row.addEventListener("contextmenu", (e) => {
            e.preventDefault();

            if (confirm(`Remove "${item.item_name}"?`)) {
                cart.splice(index, 1);
                saveCart();
                renderCart();
            }
        });

        cartBody.appendChild(row);
    });

    attachQtyListeners();
}

// =========================
// QUANTITY UPDATE
// =========================
function attachQtyListeners() {
    document.querySelectorAll(".qty-input").forEach((input, index) => {
        input.addEventListener("input", (e) => {
            let value = parseInt(e.target.value);
            if (isNaN(value) || value < 1) value = 1;

            cart[index].quantity = value;
            cart[index].total = cart[index].price * value;

            saveCart();
            renderCart();
        });
    });
}

// =========================
// CHECKOUT (IMPORTANT FIX)
// =========================
checkoutBtn.addEventListener("click", () => {

    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    let existingSales =
        JSON.parse(localStorage.getItem("checkoutCart")) || [];

    cart.forEach(cartItem => {

        const existingItem = existingSales.find(
            item => item.barcode === cartItem.barcode
        );

        if (existingItem) {
            existingItem.quantity += cartItem.quantity;
            existingItem.total =
                existingItem.quantity * existingItem.price;
        } else {
            existingSales.push({ ...cartItem });
        }
    });

    // SAVE SALES CART (INDEX PAGE)
    localStorage.setItem("checkoutCart", JSON.stringify(existingSales));

    // CLEAR PRODUCT PAGE CART
    cart = [];
    localStorage.removeItem("cart");
    renderCart();

    window.location.href = "index.html";
});

// =========================
// BACK BUTTON
// =========================
if (backBtn) {
    backBtn.addEventListener("click", () => {
        window.location.href = "index.html";
    });
}

// =========================
// DRAG CART
// =========================
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

if (cartBox && cartHeader) {
    cartHeader.addEventListener("mousedown", (e) => {
        isDragging = true;

        offsetX = e.clientX - cartBox.offsetLeft;
        offsetY = e.clientY - cartBox.offsetTop;

        cartBox.style.right = "auto";
        cartBox.style.bottom = "auto";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        cartBox.style.left = (e.clientX - offsetX) + "px";
        cartBox.style.top = (e.clientY - offsetY) + "px";
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
    });
}