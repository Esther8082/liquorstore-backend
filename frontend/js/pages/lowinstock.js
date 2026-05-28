console.log("LOW STOCK JS LOADED");

import { fetchProducts } from "../../js/api/products.api.js";
// =========================
// SETTINGS
// =========================
const LOW_STOCK_LIMIT = 10;

// =========================
// DOM
// =========================
const tbody = document.getElementById("lowStockTableBody");

// =========================
// INIT
// =========================
init();

async function init() {
    await loadLowStock();
}

// =========================
// LOAD DATA
// =========================
async function loadLowStock() {

    try {

        // 1. FIRST get products
        const products = await fetchProducts();

        console.log("ALL PRODUCTS:", products);

        // 2. THEN filter + sort
        const lowStockItems = products
            .filter(p =>
                Number(p.quantity_in_stock) <= LOW_STOCK_LIMIT
            )
            .sort((a, b) =>
                a.quantity_in_stock - b.quantity_in_stock
            );

        console.log("LOW STOCK ITEMS:", lowStockItems);

        // 3. render
        renderTable(lowStockItems);

    } catch (error) {
        console.error("Low stock load error:", error);

        if (tbody) {
            tbody.innerHTML =
                `<tr><td colspan="5">Failed to load products</td></tr>`;
        }
    }
}
// =========================
// RENDER TABLE
// =========================
function renderTable(items) {

    if (!tbody) return;

    tbody.innerHTML = "";

    if (items.length === 0) {
        tbody.innerHTML =
            `<tr><td colspan="5">No low stock items 🎉</td></tr>`;
        return;
    }

    items.forEach(item => {

        const row = document.createElement("tr");

     const isCritical = item.quantity_in_stock <= 2;

       row.innerHTML = `
    <td>${item.barcode}</td>
    <td>${item.item_name}</td>
    <td>${item.category_name}</td>
    <td>${item.quantity_in_stock}</td>
    <td class="${isCritical ? "critical" : "low"}">
        ${isCritical ? "CRITICAL" : "LOW"}
    </td>
`;

        tbody.appendChild(row);
    });
}