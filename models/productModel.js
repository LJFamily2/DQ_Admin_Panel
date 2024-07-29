const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    date: Date, 
    dryRubberUsed: Number,
    dryPercentage: Number,
    quantity: Number,
    notes: String,
});


const productModel = mongoose.model("Products", productSchema);


module.exports = productModel;
