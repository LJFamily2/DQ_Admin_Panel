function handleFormSubmit(button) {
  button.disabled = true;
  button.textContent = "Đang xử lý...";
  button.form.submit();
}
