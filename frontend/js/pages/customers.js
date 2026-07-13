import { API_BASE_URL } from "../config/api.js";
import { createCustomer } from "../api/customers.api.js";
let customers = [];
// =========================
// ELEMENTS
// =========================

const customerSearch =
    document.getElementById("customer-search");

const customersBody =
    document.getElementById("customers-body");
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
// =========================
// LOAD CUSTOMERS
// =========================

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

// =========================
// RENDER CUSTOMERS
// =========================

function renderCustomers(customers) {

    customersBody.innerHTML = "";

    customers.forEach(customer => {

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>${customer.name}</td>

            <td>${customer.phone_number ?? ""}</td>

            <td>${customer.email ?? ""}</td>

            <td>${customer.customer_type}</td>

            <td>

                <button>Edit</button>

                <button>Delete</button>

            </td>

        `;

        customersBody.appendChild(row);

    });

}

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

customerSearch.addEventListener("input", () => {

    const search =
        customerSearch.value.toLowerCase().trim();

    const filtered = customers.filter(customer =>

        customer.name.toLowerCase().includes(search) ||

        (customer.phone_number || "")
            .toLowerCase()
            .includes(search) ||

        (customer.email || "")
            .toLowerCase()
            .includes(search)

    );

    renderCustomers(filtered);

});

loadCustomers();