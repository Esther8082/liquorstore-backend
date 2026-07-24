import { createSale } from "../api/sales.api.js";
import { API_BASE_URL } from "../config/api.js";
import { printReceipt } from "./receipt.js";

// =========================
// DOM ELEMENTS
// =========================
const customerSearch =
    document.getElementById("customer-search");

const customerResults =
    document.getElementById("customer-results");

const totalElement = document.getElementById("total-amount");
const changeElement = document.getElementById("change");

const receivedInput = document.getElementById("amount-received");

const cashSection = document.getElementById("cash-section");
const cardSection = document.getElementById("card-section");
const splitSection = document.getElementById("split-section");

const cashAmountInput = document.getElementById("cash-amount");
const cardAmountInput = document.getElementById("card-amount");

const summaryList = document.getElementById("summary-list");

const printBtn = document.getElementById("print-btn");

let customers = [];

let selectedCustomer = {

    customer_id: 1,

    name: "Walk-in Customer"

};

// =========================
// LOAD CART
// =========================
const cart = JSON.parse(localStorage.getItem("checkoutCart")) || [];
async function loadCustomers(){

    const response =
        await fetch(`${API_BASE_URL}/customers`);

    customers =
        await response.json();

}

loadCustomers();
// =========================
// GRAND TOTAL
// =========================
const grandTotal = cart.reduce((sum, item) => {
    return sum + Number(item.total);
}, 0);

totalElement.textContent = `R ${grandTotal.toFixed(2)}`;

// =========================
// ORDER SUMMARY
// =========================
if (summaryList) {

    summaryList.innerHTML = "";

    cart.forEach(item => {

        const row = document.createElement("div");
        row.classList.add("summary-item");

        row.innerHTML = `
            <span class="summary-name">
                ${item.item_name} x${item.quantity}
            </span>

            <span class="summary-price">
                R ${Number(item.total).toFixed(2)}
            </span>
        `;

        summaryList.appendChild(row);

    });

}

// =========================
// CASH CHANGE
// =========================
function calculateCashChange() {

    const received = parseFloat(receivedInput.value) || 0;

  const change = received - grandTotal;

changeElement.textContent =
    `R ${change.toFixed(2)}`;

}

receivedInput.addEventListener(
    "input",
    calculateCashChange
);

// =========================
// SPLIT PAYMENT CHANGE
// =========================
function calculateSplitChange() {

    const cash = parseFloat(cashAmountInput.value) || 0;

    const card = parseFloat(cardAmountInput.value) || 0;

    const paid = cash + card;

   const change = paid - grandTotal;

changeElement.textContent =
    `R ${change.toFixed(2)}`;
}

cashAmountInput.addEventListener(
    "input",
    calculateSplitChange
);

cardAmountInput.addEventListener(
    "input",
    calculateSplitChange
);

// =========================
// PAYMENT METHOD
// =========================
document
.querySelectorAll('input[name="payment"]')
.forEach(radio => {

    radio.addEventListener("change", () => {

        // Hide all sections
        cashSection.style.display = "none";
        cardSection.style.display = "none";
        splitSection.style.display = "none";

        // Clear inputs
        receivedInput.value = "";
        cashAmountInput.value = "";
        cardAmountInput.value = "";

        // Reset change
        changeElement.textContent = "R 0.00";

        // Show selected payment section
        switch (radio.value) {

            case "cash":
                if (radio.checked)
                    cashSection.style.display = "flex";
                break;

            case "card":
                if (radio.checked)
                    cardSection.style.display = "flex";
                break;

            case "split":
                if (radio.checked)
                    splitSection.style.display = "flex";
                break;

        }

    });

});


// =========================
// PRINT
// =========================
printBtn.addEventListener("click", async () => {

    try {

       const paymentMethod =
document.querySelector('input[name="payment"]:checked')?.value;

if(!paymentMethod){

    alert("Select a payment method.");

    return;

}

let amountPaid = 0;

let cashAmount = 0;

let cardAmount = 0;

if (paymentMethod === "cash") {

    cashAmount = Number(receivedInput.value);

    amountPaid = cashAmount;

}
else if (paymentMethod === "card") {

    cardAmount = grandTotal;

    amountPaid = grandTotal;

}
else {

    cashAmount = Number(cashAmountInput.value);

    cardAmount = Number(cardAmountInput.value);

    amountPaid = cashAmount + cardAmount;

}

const changeGiven =
    Math.max(0, amountPaid - grandTotal);

// =========================
// VALIDATE PAYMENT
// =========================
if (paymentMethod === "cash" && cashAmount < grandTotal) {

    alert("Cash received is less than the total.");

    return;

}

if (paymentMethod === "split" && amountPaid < grandTotal) {

    alert("Split payment is less than the total.");

    return;

}

// =========================
// SALE OBJECT
// =========================

const sale = {

    customer_id: selectedCustomer.customer_id,

    payment_method: paymentMethod,

    subtotal: grandTotal,

    total: grandTotal,

    cash_amount: cashAmount,

    card_amount: cardAmount,

    amount_paid: amountPaid,

    change_given: changeGiven,

    items: cart.map(item => ({

        product_id: item.product_id,

        quantity: item.quantity,

        selling_price: item.price,

        line_total: item.total

    }))

}; 

       const response = await createSale(sale);

await printReceipt(response.sale_id);

localStorage.removeItem("checkoutCart");

window.location.href = "index.html";

} catch (error) {

    console.error(error);

    alert(error.message);

}

});

customerSearch.addEventListener("input", () => {

    const value =
        customerSearch.value
            .toLowerCase()
            .trim();

    customerResults.innerHTML = "";
customerResults.style.display = "block";

    if(value === ""){

        selectedCustomer = {

            customer_id:1,

            name:"Walk-in Customer"

        };

customerResults.style.display = "none";
return;

    }

    const matches = customers.filter(customer =>

        customer.name
            .toLowerCase()
            .includes(value)



    );
if (matches.length === 0) {

    customerResults.innerHTML = `
        <div class="customer-result">
            No customer found
        </div>
    `;

    customerResults.style.display = "block";
    return;
}
    matches.forEach(customer=>{

        const div =
            document.createElement("div");

        div.className = "customer-result";

        div.innerHTML = `
    <div class="customer-name">
        ${customer.name}
    </div>

    <div class="customer-phone">
        ${customer.phone_number || ""}
    </div>
`;

        div.onclick = ()=>{

            selectedCustomer = customer;

            customerSearch.value =
                customer.name;

           customerResults.innerHTML = "";
customerResults.style.display = "none";

        };

        customerResults.appendChild(div);

    });

});