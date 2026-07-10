const API_BASE_URL = "https://liquorstore-api.onrender.com";


document
.getElementById("back-btn")
.addEventListener("click", () => {

     window.location.href = "../index.html";

});

// Temporary data until backend endpoints are ready

const tableBody =
    document.getElementById("category-table-body");

const productsBody =
    document.getElementById("products-table-body");

const productsTitle =
    document.getElementById("products-title");

    const searchCategory =
    document.getElementById("search-category");

    const categoryInput =
    document.getElementById("category-name");

const addCategoryBtn =
    document.getElementById("add-category-btn");

const detailsCard =
    document.getElementById("category-details");

const editCategoryName =
    document.getElementById("edit-category-name");

const productCount =
    document.getElementById("product-count");

let selectedCategoryId = null;

    async function loadCategories() {

    const response =
        await fetch(`${API_BASE_URL}/categories`);

    const categories =
        await response.json();

    tableBody.innerHTML = "";

    categories.forEach(category => {

        tableBody.innerHTML += `

       <tr
    class="category-row"
    data-id="${category.category_id}"
    data-name="${category.category_name}">

    <td>${category.category_id}</td>

    <td>${category.category_name}</td>

    <td>${category.product_count}</td>

</tr>

        `;

    });

    addRowEvents();

}

loadCategories();

function addRowEvents() {

    document
    .querySelectorAll(".category-row")
    .forEach(row => {

        row.addEventListener("click", () => {

            const id =
                row.dataset.id;

            const name =
                row.dataset.name;

            loadProducts(id, name);

        });

    });

}

async function loadProducts(categoryId, categoryName) {

    selectedCategoryId = categoryId;

    productsTitle.textContent =
        `${categoryName} Products`;

    const response =
        await fetch(
            `${API_BASE_URL}/categories/${categoryId}/products`
        );

    const products =
        await response.json();

    productsBody.innerHTML = "";

    if(products.length === 0){

        productsBody.innerHTML = `

        <tr>

            <td colspan="5">
                No products found.
            </td>

        </tr>

        `;

    }

    products.forEach(product=>{

        productsBody.innerHTML +=`

        <tr>

            <td>${product.barcode}</td>

            <td>${product.item_name}</td>

            <td>${product.item_size}</td>

            <td>R ${Number(product.price).toFixed(2)}</td>

            <td>${product.quantity_in_stock}</td>

        </tr>

        `;

    });

    document
    .getElementById("products-section")
    .scrollIntoView({

        behavior:"smooth"

    });

    detailsCard.classList.add("show");

editCategoryName.value =
    categoryName;

productCount.textContent =
    products.length;

}

addCategoryBtn.addEventListener("click", async () => {

    const name = categoryInput.value.trim();

    if (!name) {

        alert("Please enter a category name.");

        return;

    }

    try {

        const response = await fetch(

            `${API_BASE_URL}/categories`,

            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    category_name: name

                })

            }

        );

        const result = await response.json();

        if (!response.ok) {

            throw new Error(result.error);

        }

        alert("Category added successfully.");

        categoryInput.value = "";

        loadCategories();

    }

    catch (error) {

        alert(error.message);

    }

});

function filterCategories() {

    const searchText =
        searchCategory.value.toLowerCase();

    const rows =
        document.querySelectorAll(".category-row");

    rows.forEach(row => {

        const categoryName =
            row.dataset.name.toLowerCase();

        if (categoryName.includes(searchText)) {

            row.style.display = "";

        } else {

            row.style.display = "none";

        }

    });

}
searchCategory.addEventListener("input", filterCategories);

document
.getElementById("rename-category-btn")
.addEventListener("click", async () => {

    if (!selectedCategoryId) {
        alert("Select a category first.");
        return;
    }

    const newName =
        editCategoryName.value.trim();

    if (!newName) {
        alert("Enter a category name.");
        return;
    }

    const response = await fetch(

        `${API_BASE_URL}/categories/${selectedCategoryId}`,

        {
            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                category_name: newName

            })

        }

    );

    const result = await response.json();

    if (!response.ok) {

        alert(result.error);

        return;

    }

    alert("Category renamed.");

    loadCategories();

});

document
.getElementById("delete-category-btn")
.addEventListener("click", async () => {

    if (!selectedCategoryId) {

        alert("Select a category first.");

        return;

    }

    if (!confirm("Delete this category?")) {

        return;

    }

    const response = await fetch(

        `${API_BASE_URL}/categories/${selectedCategoryId}`,

        {
            method: "DELETE"
        }

    );

    const result = await response.json();

    if (!response.ok) {

        alert(result.error);

        return;

    }

    alert("Category deleted.");

    detailsCard.classList.remove("show");

    loadCategories();

});

