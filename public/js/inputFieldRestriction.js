function handleQuantityInput(input) {
  input.value = input.value.replace(/[^0-9,]/g, ''); // Allow only numbers and a single comma
  if ((input.value.match(/,/g) || []).length > 1) {
    input.value = input.value.replace(/,(?=.*[,])/g, ''); // Remove additional commas if more than one is present
  }
  const parts = input.value.split(',');
  if (parts[1] && parts[1].length > 2) {
    input.value = parts[0] + ',' + parts[1].substring(0, 2); // Limit to two decimal places
  }
}

function handlePercentageInput(input) {
  input.value = input.value.replace(/[^0-9,]/g, ''); // Allow only numbers and a single comma
  if ((input.value.match(/,/g) || []).length > 1) {
    input.value = input.value.replace(/,(?=.*[,])/g, ''); // Remove additional commas if more than one is present
  }
  const numericValue = parseFloat(input.value.replace(',', '.'));
  if (numericValue > 100) {
    input.value = '100'; // Limit to a maximum of 100
  } else if (numericValue < 0) {
    input.value = '0'; // Limit to a minimum of 0
  }
  const parts = input.value.split(',');
  if (parts[1] && parts[1].length > 2) {
    input.value = parts[0] + ',' + parts[1].substring(0, 2); // Limit to two decimal places
  }
}
