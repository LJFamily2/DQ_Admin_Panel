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

  const suppliers = supplierNames.map((name, index) => ({
    name: name,
    code: supplierCode[index],
    phone: supplierPhone[index],
    identification: supplierIdentification[index],
    issueDate: supplierIssueDate[index],
    address: supplierAddress[index],
    ratioSplit: supplierRatioSplit[index],
  }));

  return suppliers;
}

module.exports = createSuppliers;
