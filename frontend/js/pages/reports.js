import { API_BASE_URL } from "../config/api.js";
import { printReceipt } from "./receipt.js";

// ===========================
// DOM
// ===========================

const totalSales = document.getElementById("total-sales");
const transactionCount = document.getElementById("transaction-count");
const itemsSold = document.getElementById("items-sold");

const cashSales = document.getElementById("cash-sales");
const cardSales = document.getElementById("card-sales");
const splitSales = document.getElementById("split-sales");

const bestProduct = document.getElementById("best-product");
const bestProductQty = document.getElementById("best-product-qty");

const leastProduct = document.getElementById("least-product");
const leastProductQty = document.getElementById("least-product-qty");

const salesHistory = document.getElementById("sales-history");

const topProductsBody =
    document.getElementById("top-products-body");

const leastProductsBody =
    document.getElementById("least-products-body");

const filterButtons =
    document.querySelectorAll(".filter-btn");

// ===========================
// LOAD REPORT
// ===========================

async function loadReport(period = "today") {

    try {

        const response =
            await fetch(`${API_BASE_URL}/reports?period=${period}`);

        if (!response.ok) {

            throw new Error("Unable to load report.");

        }

        const report = await response.json();

        // =======================
        // SUMMARY
        // =======================

        totalSales.textContent =
            `R ${Number(report.summary.totalSales).toFixed(2)}`;

        transactionCount.textContent =
            report.summary.transactions;

        itemsSold.textContent =
            report.summary.itemsSold;

        cashSales.textContent =
            `R ${Number(report.summary.cashSales).toFixed(2)}`;

        cardSales.textContent =
            `R ${Number(report.summary.cardSales).toFixed(2)}`;

        splitSales.textContent =
            `R ${Number(report.summary.splitSales).toFixed(2)}`;

        // =======================
        // BEST PRODUCT
        // =======================

        if (report.topProducts.length) {

            bestProduct.textContent =
                report.topProducts[0].item_name;

            bestProductQty.textContent =
                `${report.topProducts[0].quantity} sold`;

        } else {

            bestProduct.textContent = "-";
            bestProductQty.textContent = "";

        }

        // =======================
        // LEAST PRODUCT
        // =======================

        if (report.leastProducts.length) {

            leastProduct.textContent =
                report.leastProducts[0].item_name;

            leastProductQty.textContent =
                `${report.leastProducts[0].quantity} sold`;

        } else {

            leastProduct.textContent = "-";
            leastProductQty.textContent = "";

        }

        // =======================
        // SALES HISTORY
        // =======================

        salesHistory.innerHTML = "";

        report.sales.forEach(sale => {

            salesHistory.innerHTML += `

                <div class="sale-card">

                    <div class="sale-header">

                        <div class="sale-summary">

                            <span class="toggle-icon">▶</span>

                            <div>

                                <h3>${sale.receipt_number}</h3>

                                <small>
                                    ${new Date(sale.created_at).toLocaleString()}
                                </small>

                            </div>

                        </div>

                        <div class="sale-right">

                            <div>${sale.customer}</div>

                           <span class="payment-tag">
    ${sale.payment_method.charAt(0).toUpperCase() +
      sale.payment_method.slice(1)}
</span>

                            <strong>
                                R ${Number(sale.total).toFixed(2)}
                            </strong>

                        </div>

                    </div>

                    <div class="sale-details">

                       ${(sale.items || []).map(item => `

                           <div class="sale-item">

    <div>

        <strong>${item.item_name}</strong>

        <br>

        <small>
            ${item.quantity} ×
            R ${item.selling_price.toFixed(2)}
        </small>

    </div>

    <strong>

        R ${item.line_total.toFixed(2)}

    </strong>

</div>

                        `).join("")}

                        <button
                            class="print-sale-btn"
                            data-sale="${sale.sale_id}">
                            🖨 Reprint Receipt
                        </button>

                    </div>

                </div>

            `;

        });

        // =======================
        // COLLAPSIBLE CARDS
        // =======================

        document.querySelectorAll(".sale-header").forEach(header => {

            header.addEventListener("click", () => {

                const card = header.parentElement;

                const details =
                    card.querySelector(".sale-details");

                const arrow =
                    card.querySelector(".toggle-icon");

                details.classList.toggle("show");

                arrow.textContent =
                    details.classList.contains("show")
                        ? "▼"
                        : "▶";

            });

        });

        // =======================
        // REPRINT BUTTONS
        // =======================

        document.querySelectorAll(".print-sale-btn").forEach(button => {

            button.addEventListener("click", async (event) => {

                event.stopPropagation();

                const saleId =
                    button.dataset.sale;

                try {

                    await printReceipt(saleId, true);

                } catch (error) {

                    console.error(error);

                    alert(error.message);

                }

            });

        });

        // =======================
        // TOP PRODUCTS
        // =======================

        topProductsBody.innerHTML = "";

        report.topProducts.forEach(product => {

            topProductsBody.innerHTML += `

                <tr>

                    <td>${product.item_name}</td>

                    <td>${product.quantity}</td>

                    <td>
                        R ${Number(product.revenue).toFixed(2)}
                    </td>

                </tr>

            `;

        });

        // =======================
        // LEAST PRODUCTS
        // =======================

        leastProductsBody.innerHTML = "";

        report.leastProducts.forEach(product => {

            leastProductsBody.innerHTML += `

                <tr>

                    <td>${product.item_name}</td>

                    <td>${product.quantity}</td>

                </tr>

            `;

        });

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// ===========================
// FILTER BUTTONS
// ===========================

filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        filterButtons.forEach(btn =>
            btn.classList.remove("active")
        );

        button.classList.add("active");

        loadReport(button.dataset.filter);

    });

});


// ===========================
// INITIAL LOAD
// ===========================

loadReport();