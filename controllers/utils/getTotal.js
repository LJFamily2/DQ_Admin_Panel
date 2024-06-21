async function getTotal(productType){
  try{
    const datas = await DataModel.find();
    let total = datas.reduce((total, data) =>{
      return total + (data.products[productType + 'Quantity'] * data.products[productType + 'Percentage']) / 100;
    }, 0)
    return total;
  }catch(err){
    console.log(err);
    return "";
  }
}