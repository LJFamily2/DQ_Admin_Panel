function handleQuantityInput(input) {
  // Flag to check if input ends with a period
  const endsWithPeriod = input.value.endsWith('.');

  // Step 1: Allow only numbers and a single period, preserve trailing period for typing
  input.value = input.value.replace(/[^0-9.]/g, '').replace(/\.(?=.*\.)/g, '');

  // Split into whole and decimal parts
  let [whole, decimal] = input.value.split('.');

  // Step 3: Format the whole part with commas as thousand separators
  whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Step 5: Combine whole and decimal parts, reapply trailing period if it was present
  input.value = decimal ? `${whole}.${decimal}` : whole;
  if (endsWithPeriod && !decimal) {
    input.value += '.';
  }
}

function handlePercentageInput(input) {
  // Allow only numbers and a single period
  input.value = input.value.replace(/[^0-9.]/g, '').replace(/\.(?=.*\.)/g, '');

  // Check if the input ends with a period
  const endsWithPeriod = input.value.endsWith('.');

  // Convert the input value to a numeric value
  let numericValue = parseFloat(input.value);

  // Limit to a maximum of 100 and a minimum of 0
  if (numericValue > 100) {
    input.value = '100';
  } else if (numericValue < 0) {
    input.value = '0';
  } else if (!isNaN(numericValue)) {
    // Reapply the period if it was present
    input.value = numericValue.toString();
    if (endsWithPeriod) {
      input.value += '.';
    }
  }
}
