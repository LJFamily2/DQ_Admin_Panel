const mongoose = require("mongoose");

const plantationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
});


const plantationModel = mongoose.model("Vườn", plantationSchema);


module.exports = plantationModel;
