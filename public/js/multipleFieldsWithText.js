function addInputField(selector, child, detailPage, labelText) {
  const parentElement = document.querySelector(selector);
  const allChildElements = parentElement.querySelectorAll(child);
  const clonedElement = allChildElements[allChildElements.length - 1].cloneNode(true);

  // Update label text
  clonedElement.querySelector('label[for="name"]').innerHTML = `${allChildElements.length + 1}. ${labelText} ${
    !detailPage
      ? '<span><i class="ri-close-line" style="cursor: pointer" onclick="removeProduct(this, \'' + child + '\')"></i></span>'
      : ''
  }`;

  // Reset input values in the cloned element
  clonedElement.querySelectorAll('input').forEach(input => input.value = '');

  parentElement.appendChild(clonedElement);
  updateCloseLineIconsVisibility(parentElement, child);
}

function updateCloseLineIconsVisibility(parentElement, child) {
  const allChildElements = parentElement.querySelectorAll(child);
  const displayStyle = allChildElements.length > 1 ? 'inline' : 'none';
  allChildElements.forEach(childElement => {
    const closeIcon = childElement.querySelector('.ri-close-line');
    if (closeIcon) {
      closeIcon.style.display = displayStyle;
    }
  });
}

function removeProduct(element, childSelector) {
  // Remove the closest parent element
  element.closest(childSelector)?.remove();

  // Query all remaining child elements and update their labels
  document.querySelectorAll(childSelector).forEach((child, newIndex) => {
    const label = child.querySelector('label');
    label.innerHTML = label.innerHTML.replace(/^\d+/, newIndex + 1);
  });

  // Hide or show the remove buttons based on the number of remaining elements
  const displayStyle = document.querySelectorAll(childSelector).length <= 1 ? 'none' : '';
  document.querySelectorAll('.ri-close-line').forEach(button => button.style.display = displayStyle);
}

