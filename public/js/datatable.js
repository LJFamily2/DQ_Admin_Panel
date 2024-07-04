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
  inputPrice,
  dryPriceID,
  mixedPriceID,
  queryPageFooter,
  dataPageFooter,
) {
  const rowGroupOptions = {
    dataSrc: rowGroup,
  };

  if (plantationDetailPageRender) {
    const sumColumn = (rows, columnName) =>
      rows
        .data()
        .pluck(columnName)
        .reduce(
          (a, b) => a + parseFloat(b.replace(/\./g, '').replace(',', '.')),
          0,
        );

    const formatter = new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    rowGroupOptions.endRender = function (rows) {
      const dryTotal = formatter.format(sumColumn(rows, 'dryTotal'));
      const mixedQuantity = formatter.format(sumColumn(rows, 'mixedQuantity'));

      return `<span class="float-end">(Mủ quy khô: ${dryTotal} kg, Mủ tạp: ${mixedQuantity}kg)</span>`;
    };
  }

  let footerCallbackOptions = {};

  if (queryPageFooter) {
    const intVal = i => {
      if (typeof i === 'string') {
        i = i.replace(/\./g, '').replace(',', '.');
        return parseFloat(i);
      }
      return typeof i === 'number' ? i : 0;
    };

    const totalColumn = (api, colIndex) =>
      api
        .column(colIndex, { search: 'applied' })
        .data()
        .reduce((acc, val) => acc + intVal(val), 0);

    const customFormatter = num =>
      new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);

    footerCallbackOptions = {
      footerCallback: function () {
        const api = this.api();
        const columns = [2, 4, 5, 7, 9];
        columns.forEach(colIndex => {
          const total = totalColumn(api, colIndex);
          const formatted = customFormatter(total);
          $(api.column(colIndex).footer()).html(
            `<strong>${formatted}</strong>`,
          );
        });
      },
    };
  }
  if (dataPageFooter) {
    const intVal = i => {
      if (typeof i === 'string') {
        i = i.replace(/\./g, '').replace(',', '.');
        return parseFloat(i);
      }
      return typeof i === 'number' ? i : 0;
    };
    const totalColumn = (api, colIndex) =>
      api
        .column(colIndex, { search: 'applied' })
        .data()
        .reduce((acc, val) => acc + intVal(val), 0);

    const customFormatter = num =>
      new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);

    footerCallbackOptions = {
      footerCallback: function () {
        const api = this.api();
        const columns = [3, 5, 6];
        columns.forEach(colIndex => {
          const total = totalColumn(api, colIndex);
          const formatted = customFormatter(total);
          $(api.column(colIndex).footer()).html(
            `<strong>${formatted}</strong>`,
          );
        });
      },
    };
  }
  var isMobile = window.innerWidth < 1600;
  const tableOptions = {
    dom:
      "<'row m-0 p-0 py-2'<'col-sm-12 col-md-6 d-flex align-items-center'B><'col-sm-12 col-md-6 d-flex justify-content-end'f>>" +
      "<'row m-0 p-0'<'col-sm-12 p-0'tr>>" +
      "<'row m-0 p-0 py-2'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-end'p>>",
    buttons: exportsOption
      ? [
          {
            extend: 'csv',
            title: 'NHẬP MỦ NGUYÊN LIỆU CỬ ',
            className: 'btn btn-secondary',
          },
          {
            extend: 'excel',
            title: 'NHẬP MỦ NGUYÊN LIỆU CỬ ',
            className: 'btn btn-secondary',
          },
        ]
      : [],
    serverSide: true,
    processing: true,
    responsive: true,
    scrollX: isMobile,
    pagingType: 'first_last_numbers',
    rowGroup: rowGroupOptions,
    ajax: {
      url: ajaxUrl,
      type: 'POST',
      data: function (d) {
        // always initialize the date range
        d.startDate = $(startDateId).val();
        d.endDate = $(endDateId).val();

        // if inputPrice is true, then pass the dryPrice and mixedPrice to the server
        if (inputPrice) {
          d.dryPrice = $(dryPriceID).val();
          d.mixedPrice = $(mixedPriceID).val();
        }

        return d;
      },
    },
    language: {
      emptyTable: 'Không có dữ liệu',
      loadingRecords: 'Đang tải...',
      zeroRecords: 'Không có dữ liệu',
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
    ...footerCallbackOptions,
  };

  const table = $(tableId).DataTable(tableOptions);

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
    table.ajax.reload();
  });

  $(inputPrice).on('click', function () {
    table.ajax.reload();
  });
}
