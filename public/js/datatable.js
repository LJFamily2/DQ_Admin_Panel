const formatNumberForDisplay = (number, locale) => {
  return new Intl.NumberFormat(locale).format(number);
};

const parseNumber = (value) => {
  if (typeof value === "string") {
    value = value.replace(/\./g, "").replace(",", ".");
    return parseFloat(value);
  }
  return typeof value === "number" ? value : 0;
};

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
  productPageFooter,
  exportsOption,
  inputPrice,
  dryPriceID,
  mixedPriceID,
  queryPageFooter,
  dataPageFooter,
  salePageFooter,
  spendPageFooter,
  dailySupplyFooter,
  dailySupplyDetailFooter,
  dailySupplyInputFooter
) {
  let rowGroupOptions = {};

  rowGroupOptions =
    rowGroup !== false && rowGroup !== null ? { dataSrc: rowGroup } : false;

  let footerCallbackOptions = {};

  const setupFooterCallback = (columns, api, locale = "vi-VN") => {
    columns.forEach((colIndex) => {
      const total = api
        .column(colIndex, { search: "applied" })
        .data()
        .reduce((acc, val) => {
          const num = parseNumber(val);
          return !isNaN(num) ? acc + num : acc;
        }, 0);
      const formatted = formatNumberForDisplay(total, locale);
      $(api.column(colIndex).footer()).html(`<strong>${formatted}</strong>`);
    });
  };

  if (queryPageFooter) {
    const columns = [2, 4, 5, 7, 8, 10, 12];
    footerCallbackOptions = {
      footerCallback: function () {
        setupFooterCallback(columns, this.api());
      },
    };
  }

  if (dataPageFooter) {
    const columns = [2, 4, 5, 6, 8];
    footerCallbackOptions = {
      footerCallback: function () {
        setupFooterCallback(columns, this.api());
      },
    };
  }

  if (productPageFooter) {
    const columns = [2, 3];
    footerCallbackOptions = {
      footerCallback: function () {
        setupFooterCallback(columns, this.api());
      },
    };
  }
  if (salePageFooter) {
    const columns = [5];
    footerCallbackOptions = {
      footerCallback: function () {
        setupFooterCallback(columns, this.api());
      },
    };
  }
  if (spendPageFooter) {
    const columns = [5];
    footerCallbackOptions = {
      footerCallback: function () {
        setupFooterCallback(columns, this.api());
      },
    };
  }

  if (dailySupplyInputFooter) {
    const columns = [3, 5, 6, 7, 8];
    footerCallbackOptions = {
      footerCallback: function () {
        setupFooterCallback(columns, this.api());
      },
    };
  }

  if (dailySupplyDetailFooter) {
    const columns = [4, 6, 7, 8, 9];
    footerCallbackOptions = {
      footerCallback: function () {
        setupFooterCallback(columns, this.api());
      },
    };
  }

  if (dailySupplyFooter) {
    const columns = [5, 6, 7, 8];
    footerCallbackOptions = {
      footerCallback: function () {
        setupFooterCallback(columns, this.api(), "en-US");
      },
    };
  }

  const tableOptions = {
    dom:
      "<'row m-0 p-0 py-2'<'col-sm-6 col-md-6 d-flex align-items-center'lB><'col-sm-6 col-md-6 d-flex justify-content-end'f>>" +
      "<'row m-0 p-0'<'col-sm-12 p-0'tr>>" +
      "<'row m-0 p-0 py-2'<'col-sm-6 col-md-5'i><'col-sm-6 col-md-7 d-flex justify-content-end'p>>",
    buttons: exportsOption
      ? [
          {
            extend: "pdf",
          },
          {
            extend: "excel",
          },
          {
            extend: "print",
            exportOptions: {
              columns: [1, 4, 5, 6, 7, 8, 9, 10],
            },
            title: "Mủ Nguyên Liệu ",
            customize: function (win) {
              // Center the title
              $(win.document.body)
                .css("text-align", "center")
                .find("h1")
                .css("text-align", "center");
              // Add a subheader under the title
              $(win.document.body)
                .find("h1")
                .after(`<h2 style="text-align: center;">Từ ngày </h2>`);
              $(win.document.body)
                .find("table")
                .after(
                  '<p style="text-align: left; margin-top: 20px;">Tổng cộng số tiền </p>',
                  '<p style="text-align: left; margin-top: 20px;">Cộng</p>',
                  '<p style="text-align: left; margin-top: 20px;">Trừ</p>',
                  '<p style="text-align: left; margin-top: 20px;">Thực nhận</p>'
                );
            },
          },
        ]
      : [],
    serverSide: true,
    processing: true,
    lengthMenu: [{ label: "Tất cả", value: -1 }, 10, 20],
    paging: !(queryPageFooter || dailySupplyFooter),
    pagingType: "first_last_numbers",
    rowGroup: rowGroupOptions,
    ajax: {
      url: ajaxUrl,
      type: "POST",
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
      emptyTable: "Không có dữ liệu",
      loadingRecords: "Đang tải...",
      zeroRecords: "Không có dữ liệu",
      paginate: {
        first: "Đầu",
        last: "Cuối",
        // next: "Sau",
        // previous: "Trước",
      },
      search: "_INPUT_",
      searchPlaceholder: "Tìm kiếm trong bảng",
      lengthMenu: "Hiển thị _MENU_ bản ghi",
      info: "Hiển thị _START_ đến _END_ của _TOTAL_ bản ghi",
      infoEmpty: "Hiển thị 0 bản ghi",
      infoFiltered: "(lọc từ _MAX_ bản ghi)",
    },
    columns: columns.map((column) => {
      if (column.data === "id") {
        return {
          ...column,
          render: function (data, type, row) {
            return `
            <div class="d-flex justify-content-evenly fs-5">
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

  // Filter button click handler
  $(filterButtonId).on("click", function () {
    table.ajax.reload();
  });

  // Clear filter button click handler
  $(clearFilterButton).on("click", function () {
    // Clear the date inputs
    $(startDateId).val("");
    $(endDateId).val("");
    // Reset the DataTable to show all data
    table.ajax.reload();
  });

  $(inputPrice).on("click", function () {
    table.ajax.reload();
  });
}
