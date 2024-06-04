function addInputField(parentDivId) {
  // Change the add icon of the last input field to subtract
  const lastAddIcon = document.querySelector(`${parentDivId} .ri-add-line`);
  if (lastAddIcon) {
    lastAddIcon.classList.remove('ri-add-line');
    lastAddIcon.classList.add('ri-subtract-line');
    lastAddIcon.setAttribute('onclick', `removeInputField(this)`);
  }

  const newInputField = document.createElement('div');
  newInputField.classList.add('input_field', 'd-flex', 'align-items-center', 'my-1');
  newInputField.innerHTML = `
    <input
      type="text"
      class="form-control"
      name="plantation"
      placeholder="Nhập tên vườn"
    />
    <i class="ri-add-line fs-4 mx-1" onclick="addInputField('${parentDivId}')" style="cursor: pointer;"></i>
  `;

  const parentDiv = document.querySelector(parentDivId);
  parentDiv.appendChild(newInputField);
}

function removeInputField(element) {
  const parentDiv = element.parentNode.parentNode;
  element.parentNode.remove();
}