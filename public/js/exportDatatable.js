const formatNumberForDisplay = (number, locale) => {
  if (isNaN(number) || number === 0) {
    return '';
  }
  return new Intl.NumberFormat(locale).format(number);
};

const parseNumber = value => {
  if (typeof value === 'string') {
    value = value.replace(/\./g, '').replace(',', '.');
    return isNaN(parseFloat(value)) ? 0 : parseFloat(value);
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
  supplierName,
  ratioSumSplit,
  ratioRubberSplit,
  debt,
  { areaDimension, areaPrice },
) {
  const rowGroupOptions = rowGroup ? { dataSrc: rowGroup } : {};

  const updateFooterCell = (api, rowIndex, cellIndex, value) => {
    $(api.table().footer().rows[rowIndex].cells[cellIndex]).html(
      `<strong>${value}</strong>`,
    );
  };

  const setupFooterCallback = (columns, api, locale = 'vi-VN') => {
    const calculateTotal = colIndex => {
      return api
        .column(colIndex, { search: 'applied' })
        .data()
        .reduce((acc, val) => acc + parseNumber(val), 0);
    };

    // Update other footers as before
    columns.forEach(colIndex => {
      const total = calculateTotal(colIndex);
      $(api.column(colIndex).footer()).html(
        `<strong>${formatNumberForDisplay(total, locale)}</strong>`,
      );
    });

    if (individualExportPage) {
      const ajaxData = api.ajax.json();
      const latestPrices = ajaxData?.latestPrices || {
        muNuoc: 0,
        muTap: 0,
        muKe: 0,
        muDong: 0,
      };

      let totals = [];
      if (parseNumber(areaDimension) > 0 && parseNumber(areaPrice) > 0) {
        totals = [6, 11, 16, 21];
      } else {
        totals = [4, 6, , 8, 10];
      }

      totals = totals.map(colIndex =>
        parseNumber($(api.column(colIndex).footer()).text()),
      );
      const prices = ['muNuoc', 'muTap', 'muKe', 'muDong'].map(
        key => latestPrices[key] || 0,
      );

      prices.forEach((price, index) => {
        updateFooterCell(
          api,
          1,
          index + 1,
          formatNumberForDisplay(price, locale),
        );
        updateFooterCell(
          api,
          2,
          index + 1,
          formatNumberForDisplay(totals[index] * price, locale),
        );
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
    if (parseNumber(areaDimension) > 0 && parseNumber(areaPrice) > 0) {
      footerCallbackOptions = setupFooterCallbackOptions([
        7, 9, 11, 12, 14, 16, 17, 19, 21, 22, 24, 26, 27, 29,
      ]);
    } else {
      footerCallbackOptions = setupFooterCallbackOptions([3, 4, 5, 6, 7]);
    }
  }

  if (individualExportPage) {
    if (parseNumber(areaDimension) > 0 && parseNumber(areaPrice) > 0) {
      footerCallbackOptions = setupFooterCallbackOptions([
        6, 8, 11, 13, 16, 18, 21, 23,
      ]);
    } else {
      footerCallbackOptions = setupFooterCallbackOptions([4, 6, 8, 10]);
    }
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
            title: individualExportPage
              ? 'Phiếu Tính Tiền Mủ Cao Su'
              : 'Bảng Kê Ký Nhận Tiền Thanh Toán Mua Mủ Cao Su',
            exportOptions: {
              columns: ':visible',
            },
            customize: function (win) {
              if (exportPageFooter) {
                2;
                const startDate = new Date(
                  $(startDateId).val(),
                ).toLocaleDateString('vi-VN');
                const endDate = new Date($(endDateId).val()).toLocaleDateString(
                  'vi-VN',
                );
                const dateRange =
                  startDate && endDate
                    ? `Từ ngày ${startDate} đến ngày ${endDate}`
                    : '';

                $(win.document.body)
                  .find('h1')
                  .css('text-align', 'center')
                  .css('font-size', '1.5rem')
                  .after(`<h6 style="text-align: center;">${dateRange}</h6>`)
                  .end()
                  .find('h6')
                  .after(
                    `<h6 style="text-align: left;">Khu vực: ${supplierName}</h6>`,
                  );
                $(win.document.body).find('th, td').css({
                  'font-size': '0.75rem',
                });
                $(win.document.body).find('th').css({
                  'white-space': 'nowrap',
                });
              }
              if (individualExportPage) {
                const startDate = new Date(
                  $(startDateId).val(),
                ).toLocaleDateString('vi-VN');
                const endDate = new Date($(endDateId).val()).toLocaleDateString(
                  'vi-VN',
                );
                const dateRange =
                  startDate && endDate
                    ? `Từ ngày ${startDate} đến ngày ${endDate}`
                    : '';

                // Use the DataTable instance directly
                const table = $(tableId).DataTable();

                let totalAmount = 0;

                // Sum the "Thành tiền" values from the footer (last row)
                const footerRow = $(table.table().footer()).find('tr:last');
                footerRow.find('th').each(function (index) {
                  if (index > 0 && index < 4) {
                    // Columns 2, 3, 4 in the footer
                    const cellValue = $(this)
                      .text()
                      .replace(/\./g, '')
                      .replace(',', '.');
                    totalAmount += parseFloat(cellValue) || 0;
                  }
                });

                /// Add the addPrice and minusPrice to the top of the table
                const addPrice =
                  parseFloat(
                    $(addPriceId).val().replace(/\./g, '').replace(',', '.'),
                  ) || 0;
                const minusPrice =
                  parseFloat(
                    $(minusPriceId).val().replace(/\./g, '').replace(',', '.'),
                  ) || 0;
                const finalAmount = totalAmount + addPrice - minusPrice;
                const totalAfterRatio =
                  finalAmount * (ratioSumSplit.replace(',', '.') / 100);

                /// Add the date range and supplier name to the top of the table
                $(win.document.body)
                  .find('h1')
                  .css('text-align', 'center')
                  .after(`<h6 style="text-align: center;">${dateRange}</h6>`)
                  .end()
                  .find('h6')
                  .after(
                    `<h6 style="text-align: left;">Tên: ${supplierName}</h6>`,
                  )
                  .end()
                  .find('table')
                  .after(
                    `<p style="text-align: left; margin-top: 20px;">Tổng số tiền: ${formatNumberForDisplay(
                      totalAmount,
                      'vi-VN',
                    )} </p>`,
                    `${
                      addPrice > 0
                        ? `<p style="text-align: left; margin-top: 20px;">Cộng: ${formatNumberForDisplay(
                            addPrice,
                            'vi-VN',
                          )} </p>`
                        : ''
                    }`,
                    `${
                      minusPrice > 0
                        ? `<p style="text-align: left; margin-top: 20px;">Trừ: ${formatNumberForDisplay(
                            minusPrice,
                            'vi-VN',
                          )} </p>`
                        : ''
                    }`,
                    ratioSumSplit < 0
                      ? `${
                          addPrice > 0 || minusPrice > 0
                            ? `<p style="text-align: left; margin-top: 20px;">Tổng sau cộng/trừ: ${formatNumberForDisplay(
                                finalAmount,
                                'vi-VN',
                              )} </p>`
                            : ''
                        }
                    <p style="text-align: left; margin-top: 20px;">Tỉ lệ phân chia: ${ratioSumSplit}%</p>
                    <hr>
                    <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                      <p style="text-align: left; width: 50%;">Thực nhận: ${formatNumberForDisplay(
                        totalAfterRatio,
                        'vi-VN',
                      )}</p>
                      ${
                        debt > 0
                          ? `<p style="text-align: right; width: 50%;">Công nợ: ${formatNumberForDisplay(
                              debt,
                              'vi-VN',
                            )}</p>`
                          : ''
                      }
                    </div>`
                      : `${
                          addPrice > 0 || minusPrice > 0
                            ? `<p style="text-align: left; margin-top: 20px;">Tổng sau cộng/trừ: ${formatNumberForDisplay(
                                finalAmount,
                                'vi-VN',
                              )} </p>`
                            : ''
                        }
                    <hr>
                    <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                      <p style="text-align: left; width: 50%;">Thực nhận: ${formatNumberForDisplay(
                        totalAfterRatio,
                        'vi-VN',
                      )}</p>
                      ${
                        debt > 0
                          ? `<p style="text-align: right; width: 50%;">Công nợ: ${formatNumberForDisplay(
                              debt,
                              'vi-VN',
                            )}</p>`
                          : ''
                      }
                    </div>`,
                  );

                ///Set the css for the table
                $(win.document.body).find('th, td').css({
                  'font-size': '0.75rem',
                });
                $(win.document.body).find('th').css({
                  'white-space': 'nowrap',
                });
              }
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
    scrollX: window.innerWidth > 1900 ? false : true,
    pagingType: 'first_last_numbers',
    rowGroup: rowGroupOptions,
    // columnDefs: [
    //   { targets: '*', className: 'dt-body-center' }
    // ],
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
      return {
        ...column,
      };
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
