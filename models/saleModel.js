const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    productUsed: {
        type: Number,
        default: 0
    },
    products:[{
        name: String, 
        quantity: Number,
    }]
});

const saleModel = mongoose.model('Dữ liệu bán mủ', saleSchema);

module.exports = saleModel;
 