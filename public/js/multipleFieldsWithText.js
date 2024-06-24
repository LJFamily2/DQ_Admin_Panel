  // Toggle buttons
  const deleteButton = document.querySelector('.btnController .btn-danger');
  function addInputField(selector, child) {
    // Get the productLists div
    const productLists = document.querySelector(selector);

    // Get the first .productList div within productLists
    const firstProductList = productLists.querySelector(child);
    console.log(firstProductList)
    // Clone the first .productList div
    const clonedProductList = firstProductList.cloneNode(true);

    // Append the cloned div to the productLists div
    productLists.appendChild(clonedProductList);

    // If there is more than one .productList div, show the delete button
    if (productLists.querySelectorAll(child).length > 1) {
      deleteButton.style.display = 'inline';
    }
  }

  function removeInputField(selector , child) {
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