// Show area container
function showCollapse(elementId) {
  var element = document.getElementById(elementId);
  if (element) {
    var bsCollapse = new bootstrap.Collapse(element, { toggle: false });
    bsCollapse.show();
  }
}

// Display selected area in edit
document.getElementById("area").addEventListener("change", function () {
  const selectedAreaId = this.value;
  fetch(`/quan-ly-khu-vuc/getArea/${selectedAreaId}`, { method: "POST" })
    .then((response) => response.json())
    .then((data) => {
      const previousAreaContainer = document.querySelector(".collapse.show");
      if (previousAreaContainer) new bootstrap.Collapse(previousAreaContainer);

      showCollapse(`area${this.selectedIndex - 1}`);
      showCollapse("updateArea");

      const updateName = document.getElementById("updateName");
      updateName.disabled = false;
      updateName.value = data.name;

      const list = document.querySelector(".list-group");
      list.innerHTML = `<h6>Các vườn trong vườn:</h6>`;

      if (data.plantations && data.plantations.length > 0) {
        data.plantations.forEach((plantation, index) => {
          if (plantation && plantation.name) {
            list.innerHTML += `
                <li class="list-group-item d-flex justify-content-between" data-id="${
                  plantation._id
                }" data-name="${plantation.name}">
                  <span>${index + 1}. ${plantation.name}</span>
                  <div class="d-flex">
                    <i class="ri-edit-box-line mx-1 delete-icon" style="cursor: pointer"></i>
                    <i class="ri-delete-bin-line mx-1" style="cursor: pointer"></i>
                  </div>
                </li>
              `;
          }
        });
      } else {
        list.innerHTML += `<p>Không có vườn</p>`;
      }

      // Add event listener to the list
      list.addEventListener("click", function (event) {
        // Check if the clicked element is a delete icon
        if (event.target.classList.contains("ri-delete-bin-line")) {
          // Get the list item
          const listItem = event.target.closest(".list-group-item");

          // Get the id, name, and area id of the item to be deleted
          const itemId = listItem.dataset.id;
          const itemName = listItem.dataset.name;
          const areaId = document.getElementById("area").value;

          // Set the id, name, and area id in the modal
          document.getElementById("deleteId").value = itemId;
          document.getElementById("deleteName").textContent = itemName;
          document.getElementById("deleteAreaId").value = areaId;

          // Show the delete confirmation modal
          var modal = new bootstrap.Modal(
            document.getElementById("deleteConfirmModal")
          );
          modal.show();
        }
      });
    });
});

document.querySelectorAll(".areaList .btn").forEach((button) => {
  button.addEventListener("click", function () {
    this.querySelector(".ri-arrow-up-s-line").classList.toggle("rotate");
  });
});

// On active add and edit buttons
function toggleClasses(element1, element2, class1, class2) {
  element1.classList.remove(class2);
  element1.classList.add(class1);
  element2.classList.remove(class1);
  element2.classList.add(class2);
}

var createAreaButton = document.querySelector('[data-bs-target="#createArea"]');
var updateAreaButton = document.querySelector('[data-bs-target="#updateArea"]');

createAreaButton.addEventListener("click", function () {
  toggleClasses(
    createAreaButton,
    updateAreaButton,
    "btn-primary",
    "btn-secondary"
  );
});

updateAreaButton.addEventListener("click", function () {
  toggleClasses(
    updateAreaButton,
    createAreaButton,
    "btn-primary",
    "btn-secondary"
  );
});
