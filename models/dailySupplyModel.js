const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
    name: String,
    code: String
})

const dailySupplySchema = new mongoose.Schema({
    accountID: mongoose.Schema.Types.ObjectId,
    name: String,
    data: [{
        date: Date,
        quantity: Number,
        price: Number,
        supplier: mongoose.Schema.Types.ObjectId,
    }],
    suppliers: [supplierSchema],
});


const dailySupplyModel = mongoose.model("Daily Supplies", dailySupplySchema);


module.exports = dailySupplyModel;
