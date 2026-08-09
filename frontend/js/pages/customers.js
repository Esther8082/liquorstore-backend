import { API_BASE_URL } from "../config/api.js";

import {
    createCustomer,
    updateCustomer
} from "../api/customers.api.js";

// ==========================================
// STATE
// ==========================================

let customers = [];
let currentCustomerId = null;
let currentCustomerData = null;

// ==========================================
// TABLE
// ==========================================

const customerSearch =
    document.getElementById("customer-search");

const customersBody =
    document.getElementById("customers-body");

// ==========================================
// ADD CUSTOMER MODAL
// ==========================================

const addCustomerBtn =
    document.getElementById("add-customer-btn");

const customerModal =
    document.getElementById("customer-modal");

const cancelCustomerBtn =
    document.getElementById("cancel-customer-btn");

const saveCustomerBtn =
    document.getElementById("save-customer-btn");

const customerName =
    document.getElementById("customer-name");

const customerPhone =
    document.getElementById("customer-phone");

const customerEmail =
    document.getElementById("customer-email");

const customerType =
    document.getElementById("customer-type");

// ==========================================
// CUSTOMER DETAILS PANEL
// ==========================================

const customerDetails =
    document.getElementById("customer-details");

const detailName =
    document.getElementById("detail-name");

const detailNameText =
    document.getElementById("detail-name-text");

const detailPhone =
    document.getElementById("detail-phone");

const detailEmail =
    document.getElementById("detail-email");

const detailType =
    document.getElementById("detail-type");

const totalPurchases =
    document.getElementById("customer-transactions");

const totalSpent =
    document.getElementById("customer-total");

const lastPurchase =
    document.getElementById("customer-last");

const purchaseHistory =
    document.getElementById("purchase-history");

const closeDetailsBtn =
    document.getElementById("close-details-btn");

// ==========================================
// EDIT CUSTOMER MODAL
// ==========================================

const editCustomerBtn =
    document.getElementById("edit-customer-btn");

const editCustomerModal =
    document.getElementById("edit-customer-modal");

const editName =
    document.getElementById("edit-name");

const editPhone =
    document.getElementById("edit-phone");

const editEmail =
    document.getElementById("edit-email");

const editType =
    document.getElementById("edit-type");

const saveEditBtn =
    document.getElementById("save-edit-btn");

const cancelEditBtn =
    document.getElementById("cancel-edit-btn");

// ==========================================
// LOAD CUSTOMERS
// ==========================================

async function loadCustomers() {

    customersBody.innerHTML = `
<tr>
    <td colspan="5" class="loading-cell">
        <div class="spinner"></div>
        <span>Loading customers...</span>
    </td>
</tr>
`;

    try {

        const response =
            await fetch(`${API_BASE_URL}/customers`);

        customers = await response.json();

        renderCustomers(customers);

    }

    catch (error) {

        console.error(error);

    }

}

// ==========================================
// RENDER TABLE
// ==========================================

function renderCustomers(list) {

    customersBody.innerHTML = "";
 
    if (list.length === 0) {

        customersBody.innerHTML = `
        <tr>
            <td colspan="5">
                No customers found.
            </td>
        </tr>
        `;

        return;
    }
    list.forEach(customer => {

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>${customer.name}</td>

            <td>${customer.phone_number ?? ""}</td>

            <td>${customer.email ?? ""}</td>

            <td>${customer.customer_type}</td>

            <td>

                <button
                    class="view-btn">

                    View

                </button>

            </td>

        `;

        row.querySelector(".view-btn")
            .addEventListener("click", (event) => {

                event.stopPropagation();

                loadCustomerHistory(customer.customer_id);

            });

        customersBody.appendChild(row);

    });

}

// ==========================================
// SEARCH
// ==========================================

customerSearch.addEventListener("input", () => {

    const search =
        customerSearch.value.toLowerCase().trim();

    const filtered =
        customers.filter(customer =>

            customer.name.toLowerCase().includes(search)

            ||

            (customer.phone_number || "")
            .toLowerCase()
            .includes(search)

            ||

            (customer.email || "")
            .toLowerCase()
            .includes(search)

        );

    renderCustomers(filtered);

});

// ==========================================
// ADD CUSTOMER
// ==========================================

addCustomerBtn.addEventListener("click", () => {

    customerName.value = "";

    customerPhone.value = "";

    customerEmail.value = "";

    customerType.value = "Cash";

    customerModal.classList.add("show");

});

cancelCustomerBtn.addEventListener("click", () => {

    customerModal.classList.remove("show");

});

saveCustomerBtn.addEventListener("click", async () => {

    try {

        if (customerName.value.trim() === "") {

            alert("Customer name is required.");

            return;

        }

        await createCustomer({

            name: customerName.value.trim(),

            phone_number: customerPhone.value.trim(),

            email: customerEmail.value.trim(),

            customer_type: customerType.value

        });

        customerModal.classList.remove("show");

        loadCustomers();

        alert("Customer added successfully.");

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});

// ==========================================
// CLOSE DETAILS PANEL
// ==========================================

closeDetailsBtn.addEventListener("click", () => {

    customerDetails.classList.remove("show");

});

// ==========================================
// LOAD CUSTOMER HISTORY
// ==========================================

async function loadCustomerHistory(customerId) {

    try {

        currentCustomerId = customerId;

        const response =
            await fetch(
                `${API_BASE_URL}/customers/${customerId}/history`
            );

        const data =
            await response.json();

            currentCustomerData = data;

        detailName.textContent =
            data.customer.name;

        detailNameText.textContent =
            data.customer.name;

        detailPhone.textContent =
            data.customer.phone_number || "-";

        detailEmail.textContent =
            data.customer.email || "-";

        detailType.textContent =
            data.customer.customer_type;

        totalPurchases.textContent =
            data.statistics.totalPurchases;

        totalSpent.textContent =
            `R ${Number(data.statistics.totalSpent).toFixed(2)}`;

        lastPurchase.textContent =
            data.statistics.lastPurchase
                ? new Date(data.statistics.lastPurchase).toLocaleDateString()
                : "-";

        purchaseHistory.innerHTML = "";
                if (data.sales.length === 0) {

            purchaseHistory.innerHTML =
                "<p>No purchases found.</p>";

        } else {

            data.sales.forEach(sale => {

                purchaseHistory.innerHTML += `

                    <div class="purchase-card">

                        <div class="purchase-header">

                            <div class="purchase-left">

                                <h4>${sale.receipt_number}</h4>

                                <small>
                                    ${new Date(sale.created_at).toLocaleDateString()}
                                </small>

                            </div>

                            <div class="purchase-right">

                                <span class="payment-badge">

                                    ${sale.payment_method.charAt(0).toUpperCase() +
                                    sale.payment_method.slice(1)}

                                </span>

                                <h3>

                                    R ${Number(sale.total).toFixed(2)}

                                </h3>

                            </div>

                        </div>

                        <hr class="purchase-divider">

                        <button class="expand-btn">

                            View Items ▼

                        </button>

                        <div class="purchase-items">

                            ${sale.items.map(item => `

                                <div class="purchase-item">

                                    <div class="purchase-item-left">

                                        <strong>

                                            ${item.item_name}

                                        </strong>

                                        <small>

                                            ${item.quantity} ×
                                            R ${Number(item.selling_price).toFixed(2)}

                                        </small>

                                    </div>

                                    <strong class="purchase-item-total">

                                        R ${Number(item.line_total).toFixed(2)}

                                    </strong>

                                </div>

                            `).join("")}

                        </div>

                    </div>

                `;

            });

            document.querySelectorAll(".expand-btn").forEach(button => {

                button.addEventListener("click", () => {

                    const items =
                        button.nextElementSibling;

                    items.classList.toggle("show");

                    button.textContent =
                        items.classList.contains("show")
                            ? "Hide Items ▲"
                            : "View Items ▼";

                });

            });

        }

        customerDetails.classList.add("show");

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// ==========================================
// EDIT CUSTOMER
// ==========================================

editCustomerBtn.addEventListener("click", () => {

    editName.value =
        detailNameText.textContent;

    editPhone.value =
        detailPhone.textContent === "-"
            ? ""
            : detailPhone.textContent;

    editEmail.value =
        detailEmail.textContent === "-"
            ? ""
            : detailEmail.textContent;

    editType.value =
        detailType.textContent;

    editCustomerModal.classList.add("show");

});

// ==========================================
// CANCEL EDIT
// ==========================================

cancelEditBtn.addEventListener("click", () => {

    editCustomerModal.classList.remove("show");

});

// ==========================================
// SAVE CUSTOMER
// ==========================================

saveEditBtn.addEventListener("click", async () => {

    try {

        if (editName.value.trim() === "") {

            alert("Customer name is required.");

            return;

        }

        await updateCustomer(currentCustomerId, {

            name: editName.value.trim(),

            phone_number: editPhone.value.trim(),

            email: editEmail.value.trim(),

            customer_type: editType.value

        });

        editCustomerModal.classList.remove("show");

        await loadCustomers();

        await loadCustomerHistory(currentCustomerId);

        alert("Customer updated successfully.");

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});

// =========================
// CLOSE PAGE
// =========================
const closeCustomersBtn = document.getElementById("closeCustomersBtn");

if (closeCustomersBtn) {
    closeCustomersBtn.addEventListener("click", () => {
        window.location.href = "index.html";
    });
}

// ==========================================
// PRINT CUSTOMER STATEMENT
// ==========================================

const printStatementBtn =
    document.getElementById("print-statement-btn");

if (printStatementBtn) {

    printStatementBtn.addEventListener("click", () => {

        if (!currentCustomerData) {

            alert("Please open a customer first.");

            return;

        }

        const customer =
            currentCustomerData.customer;

        const statistics =
            currentCustomerData.statistics;

        const sales =
            currentCustomerData.sales;

        let purchaseRows = "";

        sales.forEach(sale => {

            let itemsHTML = "";

            sale.items.forEach(item => {

                itemsHTML += `
                    <tr>
                        <td>${item.item_name}</td>
                        <td>${item.quantity}</td>
                        <td>
                            R ${Number(item.selling_price).toFixed(2)}
                        </td>
                        <td>
                            R ${Number(item.line_total).toFixed(2)}
                        </td>
                    </tr>
                `;

            });

            purchaseRows += `

                <div class="statement-sale">

                    <div class="sale-header">

                        <div>
                            <strong>
                                Receipt:
                                ${sale.receipt_number}
                            </strong>

                            <br>

                            <span>
                                ${new Date(
                                    sale.created_at
                                ).toLocaleDateString()}
                            </span>
                        </div>

                        <div>
                            <strong>
                                Payment:
                                ${
                                    sale.payment_method
                                        .charAt(0)
                                        .toUpperCase() +
                                    sale.payment_method.slice(1)
                                }
                            </strong>

                            <br>

                            <strong>
                                R ${Number(
                                    sale.total
                                ).toFixed(2)}
                            </strong>
                        </div>

                    </div>

                    <table>

                        <thead>

                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>

                        </thead>

                        <tbody>

                            ${itemsHTML}

                        </tbody>

                    </table>

                </div>

            `;

        });

        const printWindow =
            window.open("", "_blank");

        if (!printWindow) {

            alert(
                "Please allow pop-ups to print the statement."
            );

            return;

        }

        printWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

    <title>
        Customer Statement - ${customer.name}
    </title>

    <style>

       body {
    font-family: Arial, sans-serif;
    margin: 20px;
    color: #222;
}

      .statement-header {
    text-align: center;
    margin-bottom: 15px;
}

        .statement-header h1 {
            margin-bottom: 5px;
        }

        .customer-info {
    border: 1px solid #ddd;
    padding: 10px;
    margin-bottom: 12px;
}
        .customer-info p {
            margin: 6px 0;
        }

       .summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 15px;
}
        .summary-box {
            border: 1px solid #ddd;
            padding: 15px;
            text-align: center;
        }

        .summary-box strong {
            display: block;
            font-size: 20px;
            margin-top: 5px;
        }

       .statement-sale {
    margin-bottom: 15px;
    page-break-inside: avoid;
}
        .sale-header {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #ccc;
            padding-bottom: 8px;
            margin-bottom: 10px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th,
        td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }

        th {
            background: #f2f2f2;
        }

        .total-section {
            margin-top: 30px;
            text-align: right;
            font-size: 20px;
            font-weight: bold;
        }

        .footer {
    margin-top: 15px;
    text-align: center;
    font-size: 10px;
    color: #666;
}

        @media print {

    html,
body {
    width: 80mm;
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
    font-size: 12px;
    color: #000;
}

}

    </style>

</head>

<body>

    <div class="statement-header">

        <h1>Customer Statement</h1>

        <p>
            Liquor Store POS
        </p>

        <p>
            Generated:
            ${new Date().toLocaleDateString()}
        </p>

    </div>

    <div class="customer-info">

        <h2>Customer Information</h2>

        <p>
            <strong>Name:</strong>
            ${customer.name}
        </p>

        <p>
            <strong>Phone:</strong>
            ${customer.phone_number || "-"}
        </p>

        <p>
            <strong>Email:</strong>
            ${customer.email || "-"}
        </p>

        <p>
            <strong>Customer Type:</strong>
            ${customer.customer_type}
        </p>

    </div>

    <div class="summary">

        <div class="summary-box">

            Total Purchases

            <strong>
                ${statistics.totalPurchases}
            </strong>

        </div>

        <div class="summary-box">

            Total Spent

            <strong>
                R ${Number(
                    statistics.totalSpent
                ).toFixed(2)}
            </strong>

        </div>

        <div class="summary-box">

            Last Purchase

            <strong>
                ${
                    statistics.lastPurchase
                        ? new Date(
                            statistics.lastPurchase
                        ).toLocaleDateString()
                        : "-"
                }
            </strong>

        </div>

    </div>

    <h2>Purchase History</h2>

    ${
        purchaseRows ||
        "<p>No purchases found.</p>"
    }

    <div class="total-section">

        Total Spent:
        R ${Number(
            statistics.totalSpent
        ).toFixed(2)}

    </div>

    <div class="footer">

        Liquor Store POS -
        Customer Statement

    </div>

</body>

</html>

        `);

        printWindow.document.close();

        printWindow.focus();

        setTimeout(() => {

            printWindow.print();

        }, 500);

    });

}

// ==========================================
// INITIAL LOAD
// ==========================================

loadCustomers();