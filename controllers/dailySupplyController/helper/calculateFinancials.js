function calculateFinancials(rawMaterials, percentage) {
  let totalSupplierProfit = 0;
  let debtPaid = 0;

  for (const material of rawMaterials) {
    const { name, quantity, percentage, ratioSplit, price } = material;

    if (name === 'Mủ nước') {
      totalSupplierProfit += quantity * (percentage / 100) * (ratioSplit / 100) * price;
      debtPaid += quantity * (percentage / 100) * ((100 - ratioSplit) / 100) * price;
    } else {
      totalSupplierProfit += quantity * (ratioSplit / 100) * price;
      debtPaid += quantity * ((100 - ratioSplit) / 100) * price;
    }
  }

  const retainedAmount = totalSupplierProfit * percentage / 100;
  return { debtPaid, retainedAmount };
}

module.exports = calculateFinancials;