function handleFormSubmit(button) {
  const form = button.form;
  if (form.checkValidity()) {
    button.disabled = true;
    button.textContent = "Đang xử lý...";
    form.submit();
  } else {
    form.reportValidity();
  }
}