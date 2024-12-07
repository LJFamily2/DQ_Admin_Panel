function calculateFinancials(rawMaterials, retainedPercentage) {
  let totalSupplierProfit = 0;
  let debtPaid = 0;
  for (const material of rawMaterials) {
    const { name, quantity = 0, percentage = 0, ratioSplit, price = 0 } = material;
    if (name === 'Mủ nước') {
      totalSupplierProfit += quantity * (percentage / 100) * (ratioSplit / 100) * price;
      debtPaid += quantity * (percentage / 100) * ((100 - ratioSplit) / 100) * price;
    } else {
      totalSupplierProfit += quantity * (ratioSplit / 100) * price;
      debtPaid += quantity * ((100 - ratioSplit) / 100) * price;
    }
  }
  const retainedAmount = totalSupplierProfit * retainedPercentage / 100;
  return { debtPaid, retainedAmount };
}
module.exports = calculateFinancials;