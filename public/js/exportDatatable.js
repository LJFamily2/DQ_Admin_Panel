const formatNumberForDisplay = (number, locale) => {
  return new Intl.NumberFormat(locale).format(number);
};

const parseNumber = value => {
  if (typeof value === 'string') {
    value = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(value);
  }
  return typeof value === 'number' ? value : 0;
};

function initializeExportDataTable(
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
  exportsOption,
  exportPageFooter,
  individualExportPage,
  addPriceId,
  minusPriceId,
) {
  const rowGroupOptions = rowGroup ? { dataSrc: rowGroup } : {};

  const setupFooterCallback = (columns, api, locale = 'vi-VN') => {
    const calculateTotal = colIndex => {
      return api
        .column(colIndex, { search: 'applied' })
        .data()
        .reduce((acc, val) => acc + parseNumber(val), 0);
    };

    const updateFooterCell = (rowIndex, cellIndex, value) => {
      $(api.table().footer().rows[rowIndex].cells[cellIndex]).html(
        formatNumberForDisplay(value, locale),
      );
    };

    columns.forEach(colIndex => {
      const total = calculateTotal(colIndex);
      $(api.column(colIndex).footer()).html(
        `<strong style='float: left'>${formatNumberForDisplay(
          total,
          locale,
        )}</strong>`,
      );
    });

    if (individualExportPage) {
      const ajaxData = api.ajax.json();
      const latestPrices = ajaxData?.latestPrices || {
        muNuoc: 0,
        muTap: 0,
        muDong: 0,
      };

      const totals = [4, 6, 8].map(colIndex =>
        parseNumber($(api.column(colIndex).footer()).text()),
      );
      const prices = ['muNuoc', 'muTap', 'muDong'].map(
        key => latestPrices[key] || 0,
      );

      prices.forEach((price, index) => {
        updateFooterCell(1, index + 1, price);
        updateFooterCell(2, index + 1, totals[index] * price);
      });
    }
  };

  const setupFooterCallbackOptions = columns => ({
    footerCallback: function () {
      setupFooterCallback(columns, this.api());
    },
  });

  let footerCallbackOptions;
  if (exportPageFooter) {
    footerCallbackOptions = setupFooterCallbackOptions([4, 6, 7, 9, 10, 12]);
  }

  if (individualExportPage) {
    footerCallbackOptions = setupFooterCallbackOptions([4, 6, 8]);
  }

  const pdfButton = {
    extend: 'pdf',
    className: 'btn btn-secondary',
  };

  if (exportPageFooter) {
    pdfButton.orientation = 'landscape';
    pdfButton.pageSize = 'A4';
    pdfButton.exportOptions = {
      columns: ':visible',
    };
  }

  const isMobile = window.innerWidth < 1300;
  const tableOptions = {
    dom:
      "<'row m-0 p-0 py-2'<'col-sm-12 col-md-6 d-flex align-items-center'B><'col-sm-12 col-md-6 d-flex justify-content-end'f>>" +
      "<'row m-0 p-0'<'col-sm-12 p-0'tr>>" +
      "<'row m-0 p-0 py-2'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-end'p>>",
    buttons: exportsOption
      ? [
          pdfButton,

          {
            extend: 'excel',
            exportOptions: {
              columns: ':visible',
            },
          },
          {
            extend: 'print',
            title: 'Mủ Nguyên Liệu',
            exportOptions: {
              columns: ':visible',
            },
            customize: function (win) {
              const startDate = $(startDateId).val();
              const endDate = $(endDateId).val();
              const dateRange =
                startDate && endDate
                  ? `Từ ngày ${startDate} đến ngày ${endDate}`
                  : '';

              // Use the DataTable instance directly
              const table = $(tableId).DataTable();

              let totalAmount = 0;

              // Sum the "Thành tiền" values from the footer (last row)
              const footerRow = $(table.table().footer()).find('tr:last');
              footerRow.find('th').each(function(index) {
                if (index > 0 && index < 4) {  // Columns 2, 3, 4 in the footer
                  const cellValue = $(this).text();
                  totalAmount += parseFloat(cellValue.replace(/[^\d.-]/g, '')) || 0;
                }
              });

              const addPrice = parseFloat($(addPriceId).val()) || 0;
              const minusPrice = parseFloat($(minusPriceId).val()) || 0;
              const finalAmount = totalAmount + addPrice - minusPrice;

              $(win.document.body)
                .css('text-align', 'center')
                .find('h1')
                .css('text-align', 'center')
                .after(`<h2 style="text-align: center;">${dateRange}</h2>`)
                .end()
                .find('table')
                .after(
                  `<p style="text-align: left; margin-top: 20px;">Tổng cộng số tiền: ${formatNumberForDisplay(
                    totalAmount,
                    'vi-VN',
                  )} đ</p>`,
                  `<p style="text-align: left; margin-top: 20px;">Cộng: ${formatNumberForDisplay(
                    addPrice,
                    'vi-VN',
                  )} đ</p>`,
                  `<p style="text-align: left; margin-top: 20px;">Trừ: ${formatNumberForDisplay(
                    minusPrice,
                    'vi-VN',
                  )} đ</p>`,
                  `<p style="text-align: left; margin-top: 20px;">Thực nhận: ${formatNumberForDisplay(
                    finalAmount,
                    'vi-VN',
                  )} đ</p>`,
                );
            },
          },
          {
            extend: 'colvis',
            text: 'Chọn cột',
          },
        ]
      : [],
    serverSide: true,
    processing: true,
    responsive: true,
    paging: !exportPageFooter,
    scrollX: isMobile,
    pagingType: 'first_last_numbers',
    rowGroup: rowGroupOptions,
    ajax: {
      url: ajaxUrl,
      type: 'POST',
      data: function (d) {
        d.startDate = $(startDateId).val();
        d.endDate = $(endDateId).val();

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
                  data-bs-target="${modalUpdateTarget}${row.id}"
                  style="cursor: pointer;"
              ></i>
              <i
                  class="ri-delete-bin-line"
                  data-bs-toggle="modal"
                  data-bs-target="${modalDeleteTarget}${row.id}"
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

  $(filterButtonId).on('click', function () {
    table.ajax.reload();
  });

  $(clearFilterButton).on('click', function () {
    $(startDateId).val('');
    $(endDateId).val('');
    table.ajax.reload();
  });
}
