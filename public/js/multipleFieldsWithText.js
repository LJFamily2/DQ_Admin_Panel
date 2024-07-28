function addInputField(selector, child, detailPage) {
  const productLists = document.querySelector(selector);
  const allProductLists = productLists.querySelectorAll(child);
  const clonedProductList = allProductLists[allProductLists.length - 1].cloneNode(true);

  // Update newIndex directly without intermediate variable
  clonedProductList.querySelector('label[for="name"]').innerHTML = `${allProductLists.length + 1}. Tên hàng hóa ${!detailPage ? '<span><i class="ri-close-line" style="cursor: pointer;" onclick="removeProduct(this)"></i></span>' : ''}`;
  
  // Reset input values in the cloned element
  clonedProductList.querySelectorAll('input').forEach(input => input.value = '');

  productLists.appendChild(clonedProductList);
  updateCloseLineIconsVisibility(productLists, child);

  // Directly check and update deleteButton's display property
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

function removeProduct(element) {
  // Remove the closest .productList element
  element.closest('.productList')?.remove();

  // Query all remaining .productList elements and update their labels
  document.querySelectorAll('.productList').forEach((product, newIndex) => {
    const label = product.querySelector('label');
    label.innerHTML = label.innerHTML.replace(/^\d+/, newIndex + 1);
  });

  // Hide or show the remove buttons based on the number of remaining products
  const displayStyle = document.querySelectorAll('.productList').length <= 1 ? 'none' : '';
  console.log(document.querySelectorAll('.productList').length)
  document.querySelectorAll('.ri-close-line').forEach(button => button.style.display = displayStyle);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.productLists .productList .ri-close-line').forEach(closeButton => {
    closeButton.style.display = 'none';
  });
});