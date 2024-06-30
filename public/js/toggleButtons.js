function toggleButtons(show, selector) {
  const buttons = document.querySelectorAll(selector);
  buttons.forEach(button => {
    button.style.display = show ? 'inline-block' : 'none';
  });
}
