
const checkoutBtn = document.getElementById("checkout-btn");

if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {

        const cart = JSON.parse(localStorage.getItem("checkoutCart")) || [];

        if (cart.length === 0) {
            alert("Add items to checkout first.");
            return;
        }

        window.location.href = "checkout.html";
    });
}

document
.getElementById("products-btn")
.addEventListener("click", () => {

    window.location.href = "products.html";

});