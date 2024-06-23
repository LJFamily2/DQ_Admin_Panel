const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    code: String,
    products:[{
        name: String, 
        quantity: Number,
        price: Number,
    }],
    date: Date, 
    contract: [{
        image: String,
    }]
});

const saleModel = mongoose.model('Dữ liệu bán mủ', saleSchema);

module.exports = saleModel;
 