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
  plantationDetailPageRender,
  exportsOption,
) {
  const rowGroupOptions = {
    dataSrc: rowGroup,
  };

  if (plantationDetailPageRender) {
    rowGroupOptions.endRender = function (rows, group) {
      var dryTotal = rows
        .data()
        .pluck('dryTotal')
        .reduce(function (a, b) {
          b = b.replace(/\./g, '').replace(',', '.');
          return a + parseFloat(b);
        }, 0);

      var mixedQuantity = rows
        .data()
        .pluck('mixedQuantity')
        .reduce(function (a, b) {
          b = b.replace(/\./g, '').replace(',', '.');
          return a + parseFloat(b);
        }, 0);

      // Create a number formatter.
      var formatter = new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      // Format the totals.
      dryTotal = formatter.format(dryTotal);
      mixedQuantity = formatter.format(mixedQuantity);

      return `<span class="float-end">(Mủ quy khô: ${dryTotal} kg, Mủ tạp: ${mixedQuantity}kg)</span>`;
    };
  }

  let layoutOption;
  if (exportsOption === true) {
    layoutOption = {
      bottomStart: {
        buttons: [
          { extend: 'csv', className: 'btn btn-secondary' },
          { extend: 'excel', className: 'btn btn-secondary' },
        ],
      },
    };
  }

  const table = $(tableId).DataTable({
    layout: layoutOption,
    serverSide: true,
    processing: true,
    responsive: true,
    rowGroup: rowGroupOptions,
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
