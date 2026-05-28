const API_BASE_URL = "https://liquorstore-api.onrender.com";

async function getProducts() {
    const res = await fetch(`${API_BASE_URL}/products`);
    return res.json();
}

async function getCategories() {
    const res = await fetch(`${API_BASE_URL}/categories`);
    return res.json();
}

document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // STATE
    // =========================
    let sales = JSON.parse(localStorage.getItem("checkoutCart")) || [];

    // =========================
    // ELEMENTS
    // =========================
    const salesTableBody = document.getElementById("sales-table-body");
    const clearCartBtn = document.getElementById("clear-cart-btn");

    // =========================
    // RENDER TABLE
    // =========================
    function renderSalesTable() {

        if (!salesTableBody) return;

        salesTableBody.innerHTML = "";

        if (sales.length === 0) {
            salesTableBody.innerHTML =
                `<tr><td colspan="4">No sales found</td></tr>`;
            return;
        }

        sales.forEach(item => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${item.item_name}</td>
                <td>R ${item.price}</td>
                <td>${item.quantity}</td>
                <td>R ${item.total}</td>
            `;

            salesTableBody.appendChild(row);
        });
    }

    renderSalesTable();

    // =========================
    // CLEAR CART
    // =========================
    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", () => {

            localStorage.removeItem("checkoutCart");
            sales = [];
            renderSalesTable();
        });
    }

    // =========================
    // SIDEBAR TOGGLE (HAMBURGER)
    // =========================
    const menuBtn = document.getElementById("menu-btn");
    const sidebar = document.getElementById("sidebar");

    if (menuBtn && sidebar) {
        menuBtn.addEventListener("click", () => {
            sidebar.classList.toggle("active");
        });
    }

    // =========================
    // DROPDOWN
    // =========================
    const stockBtn = document.getElementById("stock-btn");
    const stockMenu = document.getElementById("stock-menu");

    if (stockBtn && stockMenu) {
        stockBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            stockMenu.classList.toggle("active");
        });
    }

});