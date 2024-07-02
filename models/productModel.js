const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    date: Date, 
    quantity: Number,
    dryRubberUsed: Number,
    notes: String,
});


const productModel = mongoose.model("Products", productSchema);


module.exports = productModel;
