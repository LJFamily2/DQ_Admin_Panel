function filterSuppliers(
  searchInputValue,
  supplierListValue,
  listGroupItem,
  supplierNameValue,
) {
  const searchInput = document
    .getElementById(searchInputValue)
    .value.toLowerCase();
  const supplierList = document.getElementById(supplierListValue);
  const suppliers = supplierList.getElementsByTagName(listGroupItem);

  for (let i = 0; i < suppliers.length; i++) {
    const supplierName = suppliers[i]
      .getElementsByClassName(supplierNameValue)[0]
      .innerText.toLowerCase();
    if (supplierName.includes(searchInput)) {
      suppliers[i].classList.remove('d-none');
    } else {
      suppliers[i].classList.add('d-none');
    }
  }
}
