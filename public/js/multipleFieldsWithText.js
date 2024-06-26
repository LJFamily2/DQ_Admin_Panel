// Toggle buttons
const deleteButton = document.querySelector('.btnController .btn-danger');

function addInputField(selector, child) {
  const productLists = document.querySelector(selector);
  const allProductLists = productLists.querySelectorAll(child);
  const clonedProductList = allProductLists[allProductLists.length - 1].cloneNode(true);

  // Update newIndex directly without intermediate variable
  clonedProductList.querySelector('label[for="name"]').innerHTML = `${allProductLists.length + 1}. Tên hàng hóa <span><i class="ri-close-line" style="cursor: pointer;" onclick="removeProduct(${allProductLists.length + 1}, this)"></i></span>`;

  // Reset input values in the cloned element
  clonedProductList.querySelectorAll('input').forEach(input => input.value = '');

  productLists.appendChild(clonedProductList);
  updateCloseLineIconsVisibility(productLists, child);

  // Directly check and update deleteButton's display property
  document.querySelector('.btnController .btn-danger').style.display = allProductLists.length > 0 ? 'inline' : 'none';
}
function updateCloseLineIconsVisibility(productLists, child) {
  const allProductLists = productLists.querySelectorAll(child);
  const displayStyle = allProductLists.length > 1 ? 'inline' : 'none';
  allProductLists.forEach(productList => {
    const closeIcon = productList.querySelector('.ri-close-line');
    if (closeIcon) { 
      closeIcon.style.display = displayStyle;
    }
  });
}

function removeProduct(index, element) {
  // Remove the closest .productList element
  element.closest('.productList')?.remove();

  // Query all remaining .productList elements and update their labels
  document.querySelectorAll('.productList').forEach((product, newIndex) => {
    const label = product.querySelector('label');
    label.innerHTML = label.innerHTML.replace(/^\d+/, newIndex + 1);
  });

  // Hide or show the remove buttons based on the number of remaining products
  const displayStyle = document.querySelectorAll('.productList').length <= 1 ? 'none' : '';
  document.querySelectorAll('.ri-close-line').forEach(button => button.style.display = displayStyle);
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
