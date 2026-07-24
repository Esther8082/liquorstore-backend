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

// ==========================================
// INITIAL LOAD
// ==========================================

loadCustomers();