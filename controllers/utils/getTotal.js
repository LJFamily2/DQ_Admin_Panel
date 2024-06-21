async function getTotal(productType){
  try{
    const datas = await DataModel.find();
    let total = datas.reduce((total, data) =>{
      if (productType === 'mixed') {
        return total + data.products[productType + 'Quantity'];
      } else {
        return total + (data.products[productType + 'Quantity'] * data.products[productType + 'Percentage']) / 100;
      }
    }, 0)
    return total;
  }catch(err){
    console.log(err);
    return "";
  }
}

module.exports = getTotal;