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
printBtn.addEventListener("click", () => {

    alert("Printing receipt...");

});