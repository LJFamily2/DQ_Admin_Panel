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

function initializeExportDataTable (
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
  inputPrice,
  dryPriceID,
  mixedPriceID,
  queryPageFooter,
) {
  const rowGroupOptions = rowGroup ? { dataSrc: rowGroup } : {};

  const setupFooterCallback = (columns, api, locale = 'vi-VN') => {
    columns.forEach(colIndex => {
      const total = api
        .column(colIndex, { search: 'applied' })
        .data()
        .reduce((acc, val) => acc + parseNumber(val), 0);
      const formatted = formatNumberForDisplay(total, locale);
      $(api.column(colIndex).footer()).html(
        `<strong style='float: left'>${formatted}</strong>`,
      );
    });
  };

  const footerCallbackOptions = queryPageFooter ? {
    footerCallback: function () {
      setupFooterCallback([4, 6,7,9,10,12], this.api());
    },
  } : {};

  const isMobile = window.innerWidth < 1300;
  const tableOptions = {
    dom:
      "<'row m-0 p-0 py-2'<'col-sm-12 col-md-6 d-flex align-items-center'B><'col-sm-12 col-md-6 d-flex justify-content-end'f>>" +
      "<'row m-0 p-0'<'col-sm-12 p-0'tr>>" +
      "<'row m-0 p-0 py-2'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-end'p>>",
    buttons: exportsOption ? [
      {
        extend: 'pdf',
        className: 'btn btn-secondary',
      },
      {
        extend: 'excel',
        className: 'btn btn-secondary',
      },
      {
        extend: 'print',
        className: 'btn btn-secondary',
        exportOptions: {
          columns: [1, 4, 5, 6, 7, 8, 9, 10],
        },
        title: 'Mủ Nguyên Liệu',
        customize: function (win) {
          $(win.document.body)
            .css('text-align', 'center')
            .find('h1')
            .css('text-align', 'center')
            .after('<h2 style="text-align: center;">Từ ngày </h2>')
            .end()
            .find('table')
            .after(
              '<p style="text-align: left; margin-top: 20px;">Tổng cộng số tiền </p>',
              '<p style="text-align: left; margin-top: 20px;">Cộng</p>',
              '<p style="text-align: left; margin-top: 20px;">Trừ</p>',
              '<p style="text-align: left; margin-top: 20px;">Thực nhận</p>',
            );
        },
      },
    ] : [],
    serverSide: true,
    processing: true,
    responsive: true,
    paging: !queryPageFooter,
    scrollX: isMobile,
    pagingType: 'first_last_numbers',
    rowGroup: rowGroupOptions,
    ajax: {
      url: ajaxUrl,
      type: 'POST',
      data: function (d) {
        d.startDate = $(startDateId).val();
        d.endDate = $(endDateId).val();
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

  $(inputPrice).on('click', function () {
    table.ajax.reload();
  });
}