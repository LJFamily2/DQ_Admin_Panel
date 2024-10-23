const { MoneyRetained, Debt } = require('../../../models/dailySupplyModel');
async function updateAmounts(
  entry,
  debtPaidDifference,
  moneyRetainedDifference,
) {
  try {
    // Update debt amount
    await Debt.findByIdAndUpdate(
      entry.debt._id,
      { $inc: { debtPaidAmount: debtPaidDifference } },
      { new: true },
    );

    // Update money retained amount
    await MoneyRetained.findByIdAndUpdate(
      entry.moneyRetained._id,
      { $inc: { retainedAmount: moneyRetainedDifference } },
      { new: true },
    );

  } catch (error) {
    console.error('Error updating amounts:', error);
  }
}

module.exports = updateAmounts
