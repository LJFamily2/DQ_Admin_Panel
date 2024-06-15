function initializeDataTable(
  tableId,
  ajaxUrl,
  modalUpdateTarget,
  modalDeleteTarget,
  columns,
  rowGroup,
  filterButtonId,
  startDateId,
  endDateId,
  clearFilterButton,
) {
  const table = $(tableId).DataTable({
    serverSide: true,
    processing: true,
    responsive: true,
    rowGroup: {
      dataSrc: rowGroup,
    },
    ajax: {
      url: ajaxUrl,
      type: 'POST',
      data: function (d) {
        // Return modified data object with startDate and endDate
        d.startDate = $(startDateId).val();
        d.endDate = $(endDateId).val();
        return d; // Ensure to return the modified data object
      },
    },
    language: {
      emptyTable: 'Không có dữ liệu',
      loadingRecords: 'Đang tải...',
      paginate: {
        first: 'Đầu',
        last: 'Cuối',
        next: 'Sau',
        previous: 'Trước',
      },
      search: 'Tìm kiếm:',
      lengthMenu: 'Hiển thị _MENU_ bản ghi',
      info: 'Hiển thị _START_ đến _END_ của _TOTAL_ bản ghi',
      infoEmpty: 'Hiển thị 0 đến 0 của 0 bản ghi',
      infoFiltered: '(lọc từ _MAX_ bản ghi)',
    },
    lengthMenu: [10, 20],
    columns: columns.map(column => {
      if (column.data === 'id') {
        return {
          ...column,
          render: function (data, type, row) {
            return `
            <div class="d-flex justify-content-between fs-5">
              <i
                  class="ri-edit-box-line"
                  data-bs-toggle="modal"
                  data-bs-target="${modalUpdateTarget}${row.no}"
                  style="cursor: pointer;"
              ></i>
              <i
                  class="ri-delete-bin-line"
                  data-bs-toggle="modal"
                  data-bs-target="${modalDeleteTarget}${row.no}"
                  style="cursor: pointer;"
              ></i>
            </div>
            `;
          },
        };
      }
      return column;
    }),
  });

  // Filter button click handler
  $(filterButtonId).on('click', function () {
    table.ajax.reload();
  });

  // Clear filter button click handler
  $(clearFilterButton).on('click', function () {
    // Clear the date inputs
    $(startDateId).val('');
    $(endDateId).val('');
    // Reset the DataTable to show all data
    table.search('').draw();
  });
}
