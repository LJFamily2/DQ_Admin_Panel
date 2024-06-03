const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name:String,
    unit: String,
});


const productModel = mongoose.model("Hàng hóa", productSchema);


module.exports = productModel;
