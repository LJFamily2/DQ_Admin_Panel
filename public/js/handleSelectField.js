function handleProductChange(selectElement, productListContainer, detailPage) {
  const additionalFieldsContainer = productListContainer.querySelector('.additionalFields');
  const normalFieldsContainer = productListContainer.querySelector('.normalFields');

  const isDryRubber = selectElement.value === 'dryRubber';

  additionalFieldsContainer.style.display = isDryRubber ?  'block': 'none';
  normalFieldsContainer.style.display = isDryRubber ?  'none': 'block';

  additionalFieldsContainer.innerHTML = isDryRubber ?  getDryRubberFields(detailPage): '';
  normalFieldsContainer.innerHTML = isDryRubber ? '' : getNormalFields();

  // Disable or enable input fields
  additionalFieldsContainer.querySelectorAll('input').forEach(input => {
    input.disabled = !isDryRubber;
  });

  normalFieldsContainer.querySelectorAll('input').forEach(input => {
    input.disabled = isDryRubber;
  });
}

function getDryRubberFields(detailPage) {
  return detailPage ?  `
    <div class="row m-0 p-0">
      <div class="col col-md-3">
        <label for="quantity" class="form-label fw-bold">Số lượng</label>
        <input
          type="text"
          class="form-control"
          id="quantity"
          name="quantity"
          placeholder="1234,34"
          oninput="handleQuantityInput(this)"
        />
      </div>
      <div class="col col-md-3">
        <label for="percentage" class="form-label fw-bold">Hàm lượng</label>
        <input
          type="text"
          class="form-control"
          id="percentage"
          name="percentage"
          placeholder="23,45"
          oninput="handlePercentageInput(this)"
        />
      </div>
      <div class="col col-md-6 ">
        <label for="price" class="form-label fw-bold">Đơn giá</label>
        <input
          type="text"
          class="form-control"
          id="price"
          name="price"
          placeholder="20.000"
          oninput="handleQuantityInput(this)"
        />
      </div>
    </div>

  `:
  `
  <div class="row m-0 p-0">
      <div class="col col-md-6">
        <label for="quantity" class="form-label fw-bold">Số lượng</label>
        <input
          type="text"
          class="form-control"
          id="quantity"
          name="quantity"
          placeholder="1234,34"
          oninput="handleQuantityInput(this)"
        />
      </div>
      <div class="col col-md-6">
        <label for="percentage" class="form-label fw-bold">Hàm lượng</label>
        <input
          type="text"
          class="form-control"
          id="percentage"
          name="percentage"
          placeholder="23,45"
          oninput="handlePercentageInput(this)"
        />
      </div>
      <div class="row m-0 my-2 p-0">
        <div class="col">
          <label for="price" class="form-label fw-bold">Đơn giá</label>
          <input
            type="text"
            class="form-control"
            id="price"
            name="price"
            placeholder="20.000"
            oninput="handleQuantityInput(this)"
          />
        </div>
      </div>
    </div>

  `;
}

function getNormalFields() {
  return `                    
    <div class="row p-0 m-0">
      <div class="col col-md-6">
        <label class="form-label fw-bold">Số lượng</label>
        <input
          type="text"
          class="form-control"
          name="quantity"
          placeholder="1234,34"
          oninput="handleQuantityInput(this)"
        />
      </div>
      <div class="col col-md-6">
        <label class="form-label fw-bold">Đơn giá</label>
        <input
          type="text"
          class="form-control"
          name="price"
          placeholder="20.000"
          oninput="handleQuantityInput(this)"
        />
      </div>
    </div>
  `;
}
