function convertToDecimal(input) {
  if (input) {
    // First, remove all periods assuming they are used as thousand separators
    let result = input.replace(/\./g, '');
    // Then, replace the first comma with a period to handle decimal separator
    result = result.replace(',', '.');
    // Convert the string to a floating-point number
    return parseFloat(result).toFixed(2);
  }
}

module.exports = convertToDecimal;
