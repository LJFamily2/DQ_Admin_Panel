// Toggle buttons
const deleteButton = document.querySelector('.btnController .btn-danger');
function addInputField(selector, child) {
  console.log(selector);
  console.log(child);
  // Get the productLists div
  const productLists = document.querySelector(selector);
  console.log(productLists);
  // Get all .productList divs within productLists and select the last one
  const allProductLists = productLists.querySelectorAll(child);
  const lastProductList = allProductLists[allProductLists.length - 1];
  console.log(lastProductList);
  // Clone the last .productList div
  const clonedProductList = lastProductList.cloneNode(true);

  // Find the current highest index
  const lastIndex = allProductLists.length;
  // Increment the index for the new cloned element
  const newIndex = lastIndex + 1;

  // Update the label in the cloned element
  const label = clonedProductList.querySelector('label[for="name"]');
  if (label) {
    label.innerHTML = `${newIndex}. Tên hàng hóa`;
  }

  // Reset input values (optional)
  clonedProductList
    .querySelectorAll('input')
    .forEach(input => (input.value = ''));

  // Append the cloned div to the productLists div
  productLists.appendChild(clonedProductList);

  // If there is more than one .productList div, show the delete button
  if (productLists.querySelectorAll(child).length > 1) {
    deleteButton.style.display = 'inline';
  }
}

function removeInputField(selector, child) {
  // Get the productLists div
  const productLists = document.querySelector(selector);

  // Get all .row divs
  const rows = productLists.querySelectorAll(child);

  // Get the last .row div
  const lastRow = rows[rows.length - 1];

  // Remove the last .row div
  if (lastRow) {
    lastRow.remove();
  } else {
    console.log('No .row div to remove in ' + selector);
  }

  // If there is only one .row div, hide the delete button
  if (rows.length <= 2) {
    deleteButton.style.display = 'none';
  }
}
