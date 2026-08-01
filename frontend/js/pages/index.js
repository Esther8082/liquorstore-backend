

const checkoutBtn = document.getElementById("checkout-btn");
const contextMenu =
document.getElementById("context-menu");

const deleteItemBtn =
document.getElementById("delete-item-btn");

let selectedCartIndex = null;


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


async function handleBarcodeScan(barcode) {

    try {

        const response = await fetch(`${API_BASE_URL}/products/barcode/${barcode}`);

        if (!response.ok) {
            alert("Product not found.");
            return;
        }

        const product = await response.json();

        addProductToCart(product);

    } catch (err) {
        console.error(err);
    }

}