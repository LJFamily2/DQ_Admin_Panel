const mongoose = require('mongoose');

const productTotalSchema = new mongoose.Schema({
    dryRubber: {
        type: Number,
        default: 0
    },
    mixedQuantity:{
        type: Number,
        default: 0
    },
    product:{
        type:Number,
        default: 0
    }, 
    income:{
        type:Number,
        default: 0
    },
});

const productTotalModel = mongoose.model('Dữ liệu Tổng', productTotalSchema);

module.exports = productTotalModel;
 