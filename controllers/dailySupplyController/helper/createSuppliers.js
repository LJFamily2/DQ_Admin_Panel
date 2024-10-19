const convertToDecimal = require('../../utils/convertToDecimal');
const ensureArray = input => (Array.isArray(input) ? input : [input]);

async function createSuppliers(req) {
  const {
    supplierName,
    code,
    manager,
    phone,
    identification,
    issueDate,
    supplierAddress,
    ratioSumSplit,
    ratioRubberSplit,
    areaDeposit,
    purchasedAreaPrice,
    purchasedAreaDimension,
    areaDuration,
    moneyRetainedPercentage,
  } = req.body;

  const suppliers = ensureArray(supplierName)
    .map((name, index) => {
      if (name) {
        return {
          name,
          code: ensureArray(code)[index],
          manager: ensureArray(manager)[index],
          phone: ensureArray(phone)[index],
          identification: ensureArray(identification)[index],
          issueDate: ensureArray(issueDate)[index],
          supplierAddress: ensureArray(supplierAddress)[index],
          ratioSumSplit: convertToDecimal(ensureArray(ratioSumSplit)[index]),
          ratioRubberSplit: convertToDecimal(
            ensureArray(ratioRubberSplit)[index],
          ),
          areaDeposit: convertToDecimal(ensureArray(areaDeposit)[index]),
          purchasedAreaPrice: convertToDecimal(
            ensureArray(purchasedAreaPrice)[index],
          ),
          purchasedAreaDimension: ensureArray(purchasedAreaDimension)[index],
          moneyRetainedPercentage: convertToDecimal(
            ensureArray(moneyRetainedPercentage)[index],
          ),
          areaDuration: ensureArray(areaDuration)[index],
        };
      }
    })
    .filter(Boolean);

  return suppliers;
}

module.exports = createSuppliers;
