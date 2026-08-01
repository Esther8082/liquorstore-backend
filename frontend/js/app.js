const API_BASE_URL = "https://liquorstore-api.onrender.com";

// =========================
// API
// =========================
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
    let sales =
        JSON.parse(localStorage.getItem("checkoutCart")) || [];

    let selectedIndex = null;

    let barcodeBuffer = "";
let barcodeTimer = null;

    // =========================
    // ELEMENTS
    // =========================
    const salesTableBody =
        document.getElementById("sales-table-body");

    const salesTotal =
        document.getElementById("sales-total");

    const clearCartBtn =
        document.getElementById("clear-cart-btn");

    const contextMenu =
        document.getElementById("context-menu");

    const deleteItemBtn =
        document.getElementById("delete-item-btn");

    // =========================
    // RENDER TABLE
    // =========================
    function renderSalesTable() {

        if (!salesTableBody) return;

        salesTableBody.innerHTML = "";

        let grandTotal = 0;

        if (sales.length === 0) {

            salesTableBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        No sales found
                    </td>
                </tr>
            `;

            if (salesTotal) {
                salesTotal.textContent = "R 0.00";
            }

            return;
        }

        sales.forEach((item, index) => {

            grandTotal += Number(item.total);

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${item.item_name}</td>
                <td>R ${Number(item.price).toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>R ${Number(item.total).toFixed(2)}</td>
            `;

            // =========================
            // RIGHT CLICK
            // =========================
            row.addEventListener("contextmenu", (e) => {

                e.preventDefault();

                selectedIndex = index;

                contextMenu.style.left = `${e.pageX}px`;
                contextMenu.style.top = `${e.pageY}px`;

                contextMenu.classList.remove("hidden");

            });

            salesTableBody.appendChild(row);

        });

        if (salesTotal) {
            salesTotal.textContent =
                `R ${grandTotal.toFixed(2)}`;
        }
    }

    renderSalesTable();



    async function handleBarcodeScan(barcode) {

    try {

        const response = await fetch(
            `${API_BASE_URL}/products/barcode/${barcode}`
        );

        if (!response.ok) {
            alert("Product not found.");
            return;
        }

        const product = await response.json();

        addScannedProduct(product);

    } catch (err) {

        console.error(err);

    }

}

function addScannedProduct(product) {

    const existing = sales.find(
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

        sales.push({

            product_id: product.product_id,
            barcode: product.barcode,
            item_name: product.item_name,
            price: Number(product.price),
            quantity: 1,
            total: Number(product.price)

        });

    }

    localStorage.setItem(
        "checkoutCart",
        JSON.stringify(sales)
    );

    renderSalesTable();

}

document.addEventListener("keydown", (e) => {

    // =========================
    // BARCODE SCANNER
    // =========================

    // Stop scanner input from going into the page
    if (e.key.length === 1 || e.key === "Enter") {
        e.preventDefault();
    }

    // Scanner finished barcode
    if (e.key === "Enter") {

        if (barcodeBuffer.length > 0) {

            console.log("SCANNED BARCODE:", barcodeBuffer);

            handleBarcodeScan(barcodeBuffer);

            barcodeBuffer = "";

        }

        clearTimeout(barcodeTimer);

        return;
    }

    // Capture barcode numbers
    if (e.key.length === 1) {

        barcodeBuffer += e.key;

    }

    // Allow a little more time between scanner keys
    clearTimeout(barcodeTimer);

    barcodeTimer = setTimeout(() => {

        barcodeBuffer = "";

    }, 500);

});

    // =========================
    // DELETE ITEM
    // =========================
    if (deleteItemBtn) {

        deleteItemBtn.addEventListener("click", () => {

            if (selectedIndex === null) return;

            sales.splice(selectedIndex, 1);

            localStorage.setItem(
                "checkoutCart",
                JSON.stringify(sales)
            );

            renderSalesTable();

            contextMenu.classList.add("hidden");

            selectedIndex = null;

        });

    }

    // =========================
    // HIDE MENU
    // =========================
    document.addEventListener("click", () => {

        contextMenu.classList.add("hidden");

    });

    // =========================
    // CLEAR CART
    // =========================
    if (clearCartBtn) {

        clearCartBtn.addEventListener("click", () => {

            if (sales.length === 0) return;

            if (confirm("Clear all items?")) {

                localStorage.removeItem("checkoutCart");

                sales = [];

                renderSalesTable();

            }

        });

    }

    // =========================
    // SIDEBAR
    // =========================
    const menuBtn =
        document.getElementById("menu-btn");

    const sidebar =
        document.getElementById("sidebar");

    if (menuBtn && sidebar) {

        menuBtn.addEventListener("click", () => {

            sidebar.classList.toggle("active");

        });

    }

    // =========================
    // STOCK DROPDOWN
    // =========================
    const stockBtn =
        document.getElementById("stock-btn");

    const stockMenu =
        document.getElementById("stock-menu");

    if (stockBtn && stockMenu) {

        stockBtn.addEventListener("click", (e) => {

            e.stopPropagation();

            stockMenu.classList.toggle("active");

        });

    }

});