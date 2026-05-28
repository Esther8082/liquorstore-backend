const API_BASE_URL = "https://liquorstore-api.onrender.com";
let allProducts = [];

// =========================
// LOAD PRODUCTS
// =========================
async function loadInventory() {

    try {

        const res = await fetch(`${API_BASE_URL}/products`); allProducts = await res.json();

        renderCards(allProducts);

    } catch (error) {
        console.error("INVENTORY LOAD ERROR:", error);
    }
}

loadInventory();

const searchInput = document.getElementById("inventory-search");

searchInput.addEventListener("input", function () {

    const searchTerm = this.value.toLowerCase();

   const filtered = allProducts.filter(product => {

    return (
        product.item_name?.toLowerCase().includes(searchTerm) ||
        String(product.barcode).includes(searchTerm) ||
        product.category_name?.toLowerCase().includes(searchTerm)
    );
});

    renderCards(filtered);
});

/*render cards*/ 

function renderCards(products) {

    const container = document.getElementById("inventory-grid");
    container.innerHTML = "";

    products.forEach(product => {

        const card = document.createElement("div");
        card.classList.add("product-card");

       const imageUrl = product.image_url
    ? `${API_BASE_URL}${product.image_url}`
    : "https://via.placeholder.com/150";
    
        const stockClass =
            product.quantity_in_stock > 0
                ? "in-stock"
                : "out-stock";

        const stockText =
            product.quantity_in_stock > 0
                ? "In Stock"
                : "Out of Stock";

        card.innerHTML = `
            <div class="img-wrapper">
                <img src="${imageUrl}" alt="${product.item_name}" class="product-img">
            </div>

            <h3>${product.item_name}</h3>

            <p><strong>Category:</strong> ${product.category_name || "Unassigned"}</p>

            <p><strong>Price:</strong> R ${product.price}</p>

            <p><strong>Stock:</strong> ${product.quantity_in_stock}</p>

            <span class="stock ${stockClass}">
                ${stockText}
            </span>
        `;

        // ✅ FIX: attach click INSIDE loop
        const img = card.querySelector(".product-img");

        img.addEventListener("click", () => {
            openImageModal(imageUrl, product.item_name);
        });

        container.appendChild(card);
    });
}

// =========================
// FILTER FUNCTION
// =========================
function filterCategory(categoryName) {

    if (categoryName === "ALL") {
       renderCards(allProducts);
        return;
    }

    const filtered = allProducts.filter(product =>
        product.category_name === categoryName
    );

    renderCards(filtered);
}

// =========================
// BUTTON EVENTS
// =========================
document.addEventListener("DOMContentLoaded", () => {

    const allBtn = document.getElementById("filter-all");
    const quartsBtn = document.getElementById("filter-quarts");
    const dumpiesBtn = document.getElementById("filter-dumpies");
    const champagnesBtn = document.getElementById("filter-champagnes");

    allBtn?.addEventListener("click", () => filterCategory("ALL"));
    quartsBtn?.addEventListener("click", () => filterCategory("Quarts"));
    dumpiesBtn?.addEventListener("click", () => filterCategory("Dumpies"));
    champagnesBtn?.addEventListener("click", () => filterCategory("Champagnes"));
});
function openImageModal(imageUrl, title) {

    let modal = document.getElementById("image-modal");

    if (!modal) {
        modal = document.createElement("div");
        modal.id = "image-modal";
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <img id="modal-img" src="" alt="">
                <p id="modal-title"></p>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector(".modal-backdrop").addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    document.getElementById("modal-img").src = imageUrl;
    document.getElementById("modal-title").textContent = title;

    modal.style.display = "flex";
}

// =========================
// CLOSE INVENTORY
// =========================
const closeBtn = document.getElementById("closeInventoryBtn");

closeBtn.addEventListener("click", () => {
    window.location.href = "index.html";
});