import { createSale } from "../api/sales.api.js";

// =========================
// DOM ELEMENTS
// =========================
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

// =========================
// LOAD CART
// =========================
const cart = JSON.parse(localStorage.getItem("checkoutCart")) || [];

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

if(paymentMethod === "cash"){

    amountPaid =
        Number(receivedInput.value);

}
else if(paymentMethod === "card"){

    amountPaid =
        grandTotal;

}
else{

    amountPaid =
        Number(cashAmountInput.value) +
        Number(cardAmountInput.value);

}

const changeGiven =
    Math.max(0, amountPaid - grandTotal);

const sale = {

    customer_id: 1,

    payment_method: paymentMethod,

    subtotal: grandTotal,

    total: grandTotal,

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

        console.log(response);

        alert("Sale saved successfully.");

        localStorage.removeItem("checkoutCart");

        window.location.href = "index.html";

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});