function disableSubmitButton(event) {
  const form = event.target;
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerText = 'Đang xử lý...';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', disableSubmitButton);
  });
});