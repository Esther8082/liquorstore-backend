const express = require("express");

const {
    createProduct,
    fetchAllProducts,
    getProductByBarcode,
    updateProduct,
    deleteProduct,
    deleteProductImage
} = require("../controllers/products.controller");


const productsRouter = express.Router();
const upload = require("../middleware/upload");

// CREATE PRODUCT
productsRouter.post("/", upload.single("image"), createProduct);

// GET ALL PRODUCTS
productsRouter.get("/", fetchAllProducts);

// GET PRODUCT BY BARCODE
productsRouter.get("/barcode/:barcode", getProductByBarcode);

// UPDATE PRODUCT (STOCK ADJUSTMENT)
productsRouter.put(
    "/:id",
    upload.single("image"),
    updateProduct
);

// DELETE PRODUCT
productsRouter.delete("/:id", deleteProduct);

// DELETE PRODUCT IMAGE ONLY
productsRouter.delete("/:id/image", deleteProductImage);

module.exports = productsRouter;