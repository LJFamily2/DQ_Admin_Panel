const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    code: String,
    products:[{
        name: String, 
        quantity: Number,
        price: Number,
    }],
    date: Date, 
    status: {
        type: String,
        enum: ["active", "closed"]
    }
});

const saleModel = mongoose.model('Dữ liệu bán mủ', saleSchema);

module.exports = saleModel;
 