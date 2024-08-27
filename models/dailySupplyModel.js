const mongoose = require("mongoose");
const slug = require('mongoose-slug-generator');
mongoose.plugin(slug);

const supplierSchema = new mongoose.Schema({
    name: String,
    code: String
});

const dailySupplySchema = new mongoose.Schema({
    accountID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Accounts',
    },
    name: String,
    data: [{
        date: Date,
        quantity: Number,
        price: Number,
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier' 
        },
    }],
    suppliers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier' 
    }],
    slug: {
        type: String,
        slug: 'name'
    }

});

const Supplier = mongoose.model("Supplier", supplierSchema);
const DailySupply = mongoose.model("DailySupply", dailySupplySchema);

module.exports = {
    Supplier,
    DailySupply
};