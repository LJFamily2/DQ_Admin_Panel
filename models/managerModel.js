const mongoose = require('mongoose');
const Vườn = require('./plantationModel copy');

const managerSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },
  plantations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vườn',
    },
  ],
  frontIdentification: {
    type: String,
  },
  backIdentification: {
    type: String,
  },
});

const managerModel = mongoose.model('Người Quản Lý', managerSchema);

module.exports = managerModel;
