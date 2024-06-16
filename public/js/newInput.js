function newInput(element) {
  element.style.border = '1px solid green';
}

function resetInput() {
  let elements = document.querySelectorAll('.form-control');
  elements.forEach(element => {
    element.style.border = '1px solid #dee2e6';
  });
}
