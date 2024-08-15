function convertToDecimal(input) {
  if (input) {
    // Assign input to result
    let result = input;

    if (result.includes(',')) {
      // Case 1: Input is in the format 1,489.3834
      // Remove all commas
      result = result.replace(/,/g, '');
    } else if (result.includes('.') && !result.includes(',')) {
      // Case 2: Input is in the format 2.343.435
      // Remove all periods
      result = result.replace(/\./g, '');
    }

    // Convert the string to a floating-point number
    return parseFloat(result);
  }
}

module.exports = convertToDecimal;