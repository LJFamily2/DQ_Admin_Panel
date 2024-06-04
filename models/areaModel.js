const mongoose = require("mongoose");

const areaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    plantations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vườn"
    }],
});


const areaModel = mongoose.model("Khu Vực", areaSchema);


module.exports = areaModel;
