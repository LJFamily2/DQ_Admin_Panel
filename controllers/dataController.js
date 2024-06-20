const trimStringFields = require('./utils/trimStringFields')
const handleResponse = require("./utils/handleResponse");
const DataModel = require('../models/dataModel');
module.exports = {
  renderPage,
};

async function renderPage(req, res) {
  try {
    const datas = await DataModel.find({});
    res.render('src/dataPage', {
      layout: './layouts/defaultLayout',
      datas,
      messages: req.flash(),
      title: 'Dữ liệu',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createData(req,res){
  req.body = trimStringFields(req.body)
  try{
    console.log(req.body)
    const newData = await DataModel.create({
      ...req.body
    });
    if(!newData){
      handleResponse(req,res,404,'fail','Tạo dữ liệu thất bại','/du-lieu')
    }else{
      handleResponse(req,res,200,'success','Tạo dữ liệu thành công','/du-lieu')
    }
  }catch(error){
    console.log(error)
    res.status(500);
  }
}