const API_BASE_URL = "https://liquorstore-api.onrender.com";
let allProducts = [];
let categories = [];

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


async function loadCategories() {

    try {

        const response =
            await fetch(`${API_BASE_URL}/categories`);

        categories = await response.json();

        renderCategories();

    }

    catch (error) {

        console.error(error);

    }

}
function renderCategories() {

    const list =
        document.getElementById("category-list");

    list.innerHTML = "";

    // All Products button
    const allItem = document.createElement("li");

    allItem.innerHTML = `
        <button class="sidebar-btn active">
            All Products
        </button>
    `;

    allItem.querySelector("button").addEventListener("click", () => {

        setActiveButton(allItem.querySelector("button"));

        renderCards(allProducts);

    });

    list.appendChild(allItem);

    // Database categories
    categories.forEach(category => {

        const li =
            document.createElement("li");

        li.innerHTML = `
            <button class="sidebar-btn">
                ${category.category_name}
            </button>
        `;

        li.querySelector("button").addEventListener("click", () => {

            setActiveButton(li.querySelector("button"));

            filterCategory(category.category_name);

        });

        list.appendChild(li);

    });

}
async function init() {

    await loadInventory();

    await loadCategories();

}

init();
function setActiveButton(button) {

    document.querySelectorAll(".sidebar-btn").forEach(btn =>

        btn.classList.remove("active")

    );

    button.classList.add("active");

}

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
    : "./logoimage/noimageavilable.jpeg";
        
let stockColor = "#16a34a"; // Green

if (product.quantity_in_stock <= 0) {

    stockColor = "#dc2626"; // Red

}
else if (product.quantity_in_stock <= 5) {

    stockColor = "#f59e0b"; // Orange

}

       card.innerHTML = `
    <div class="img-wrapper">
        <img src="${imageUrl}" alt="${product.item_name}" class="product-img">
    </div>

    <h3>${product.item_name}</h3>

    <p>
        <strong>Barcode:</strong>
        ${product.barcode}
    </p>

    <p>
        <strong>Category:</strong>
        ${product.category_name || "Unassigned"}
    </p>

    <p>
        <strong>Price:</strong>
        R ${Number(product.price).toFixed(2)}
    </p>

   <p>

    <strong>Stock:</strong>

    <span
        style="
            color:${stockColor};
            font-weight:bold;
        "
    >

        ${product.quantity_in_stock}

    </span>

</p>  
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