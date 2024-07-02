const mongoose = require("mongoose");

const areaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    plantations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plantations"
    }],
});


const areaModel = mongoose.model("Areas", areaSchema);


module.exports = areaModel;
