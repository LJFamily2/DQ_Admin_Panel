const ensureArray = input => (Array.isArray(input) ? input : [input]);
// Helper function
async function createSuppliers(req) {
  const supplierNames = ensureArray(req.body.supplierName);
  let supplierCode = ensureArray(req.body.code);
  let supplierPhone = ensureArray(req.body.phone);
  let supplierIdentification = ensureArray(req.body.identification);
  let supplierIssueDate = ensureArray(req.body.issueDate);
  let supplierAddress = ensureArray(req.body.address);
  let supplierRatioSplit = ensureArray(req.body.ratioSplit);
  let supplierAreaDeposit = ensureArray(req.body.areaDeposit);
  let supplierPurchasedPrice = ensureArray(req.body.purchasedPrice);
  let supplierPurchasedAreaDimension = ensureArray(req.body.purchasedAreaDimension);
  let supplierAreaDurationStart = ensureArray(req.body.areaDurationStart);
  let supplierAreaDurationEnd = ensureArray(req.body.areaDurationEnd);

  const suppliers = supplierNames.map((name, index) => {
    // Only create supplier if the name is provided
    if (name) {
      return {
        name: name,
        code: supplierCode[index],
        phone: supplierPhone[index],
        identification: supplierIdentification[index],
        issueDate: supplierIssueDate[index],
        address: supplierAddress[index],
        ratioSplit: supplierRatioSplit[index],
        areaDeposit: supplierAreaDeposit[index],
        purchasedPrice: supplierPurchasedPrice[index],
        purchasedAreaDimension: supplierPurchasedAreaDimension[index],
        areaDuration: {
          start: supplierAreaDurationStart[index],
          end: supplierAreaDurationEnd[index]
        }
      };
    }
  }).filter(Boolean); 

  return suppliers;
}

module.exports = createSuppliers;
