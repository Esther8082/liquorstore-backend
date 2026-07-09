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

    const salesTotal = document.getElementById("sales-total");

    salesTableBody.innerHTML = "";

    let grandTotal = 0;

    if (sales.length === 0) {
        salesTableBody.innerHTML =
            `<tr><td colspan="4">No sales found</td></tr>`;

        if (salesTotal) {
            salesTotal.textContent = "R 0.00";
        }

        return;
    }

    sales.forEach(item => {

        grandTotal += Number(item.total);

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.item_name}</td>
            <td>R ${Number(item.price).toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td>R ${Number(item.total).toFixed(2)}</td>
        `;

        salesTableBody.appendChild(row);
    });

    if (salesTotal) {
        salesTotal.textContent = `R ${grandTotal.toFixed(2)}`;
    }
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