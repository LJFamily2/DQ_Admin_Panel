const formatNumberForDisplay = (number, locale) => {
  if (isNaN(number) || number === 0) {
    return "";
  }
  return new Intl.NumberFormat(locale).format(number);
};

const parseNumber = (value) => {
  if (typeof value === "string") {
    value = value.replace(/\./g, "").replace(",", ".");
    return isNaN(parseFloat(value)) ? 0 : parseFloat(value);
  }
  return typeof value === "number" ? value : 0;
};

const cleanExcelData = (data) => {
  if (!data || data === "") return "";
  if (typeof data === "string") {
    const cleanText = data.replace(/<\/?[^>]+(>|$)/g, "").trim();
    if (!cleanText) return "";
    const number = cleanText.replace(/\./g, "").replace(",", ".");
    return !isNaN(number) ? parseFloat(number).toString() : cleanText;
  }
  return data;
};

function createColvisGroup(text, columns) {
  return {
    extend: "colvisGroup",
    text: text,
    columns: columns,
    action: function (e, dt, node, config) {
      var columns = dt.columns(config.columns);
      var visible = !columns.visible()[0];
      this.active(visible);
      columns.visible(visible);
      // Remove the dt-button-active class from the selectAllColvisGroup button
      $(dt.buttons(".selectAllColvisGroup").nodes()).removeClass(
        "dt-button-active"
      );
    },
  };
}

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
  { debt, retainedAmount },
  { areaDimension, areaPrice }
) {
  const rowGroupOptions = rowGroup ? { dataSrc: rowGroup } : {};

  const updateFooterCell = (api, rowIndex, cellIndex, value) => {
    $(api.table().footer().rows[rowIndex].cells[cellIndex]).html(
      `<strong>${value}</strong>`
    );
  };

  const setupFooterCallback = (columns, api, locale = "vi-VN") => {
    const calculateTotal = (colIndex) => {
      return api
        .column(colIndex, { search: "applied" })
        .data()
        .reduce((acc, val) => acc + parseNumber(val), 0);
    };

    // Update other footers as before
    columns.forEach((colIndex) => {
      const total = calculateTotal(colIndex);
      $(api.column(colIndex).footer()).html(
        `<strong>${formatNumberForDisplay(total, locale)}</strong>`
      );
    });

    if (
      individualExportPage &&
      parseNumber(areaDimension) === 0 &&
      parseNumber(areaPrice) === 0
    ) {
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
        totals = [4, 6, 8, 10];
      }

      totals = totals.map((colIndex) =>
        parseNumber($(api.column(colIndex).footer()).text())
      );
      const prices = ["muNuoc", "muTap", "muKe", "muDong"].map(
        (key) => latestPrices[key] || 0
      );

      prices.forEach((price, index) => {
        updateFooterCell(
          api,
          1,
          index + 1,
          formatNumberForDisplay(price, locale)
        );
        updateFooterCell(
          api,
          2,
          index + 1,
          formatNumberForDisplay(totals[index] * price, locale)
        );
      });
    }
  };

  const setupFooterCallbackOptions = (columns) => ({
    footerCallback: function () {
      setupFooterCallback(columns, this.api());
    },
  });

  let footerCallbackOptions;
  if (exportPageFooter) {
    if (parseNumber(areaDimension) > 0 && parseNumber(areaPrice) > 0) {
      footerCallbackOptions = setupFooterCallbackOptions([
        3, 4, 5, 6, 7, 8, 9, 11, 12, 14, 16, 17, 19, 21, 22, 24, 26, 27, 29, 30,
      ]);
    } else {
      footerCallbackOptions = setupFooterCallbackOptions([3, 4, 5, 6, 7]);
    }
  }

  if (individualExportPage) {
    if (parseNumber(areaDimension) > 0 && parseNumber(areaPrice) > 0) {
      footerCallbackOptions = setupFooterCallbackOptions([
        2, 4, 6, 8, 9, 11, 13, 14, 16, 18, 19, 21, 23, 25,
      ]);
    } else {
      footerCallbackOptions = setupFooterCallbackOptions([4, 6, 8, 10]);
    }
  }

  const pdfButton = {
    extend: "pdf",
  };

  if (exportPageFooter) {
    pdfButton.orientation = "landscape";
    pdfButton.pageSize = "A4";
    pdfButton.exportOptions = {
      columns: ":visible",
    };
  }

  const tableOptions = {
    dom:
      "<'row m-0 p-0 py-2'<'col-sm-12 col-md-6 d-flex align-items-center'B><'col-sm-12 col-md-6 d-flex justify-content-end'f>>" +
      "<'row m-0 p-0'<'col-sm-12 p-0'tr>>" +
      "<'row m-0 p-0 py-2'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-end'p>>",
    buttons: exportsOption
      ? [
          {
            extend: "collection",
            text: "Xuất file",
            collectionLayout: "fixed columns",
            popoverTitle: `<h4 class='m-0'>Xuất file</h4><hr>`,
            buttons: [
              pdfButton,
              {
                extend: "excel",
                exportOptions: {
                  columns: ":visible",
                  format: {
                    body: (data) => cleanExcelData(data),
                    footer: (data) => cleanExcelData(data),
                  },
                },
              },
            ],
          },
          {
            extend: "print",
            text: "In",
            title: individualExportPage
              ? `PHIẾU TÍNH TIỀN MỦ CAO SU`
              : "BẢNG KÊ KÝ NHẬN TIỀN THANH TOÁN MUA MỦ CAO SU",
            exportOptions: {
              columns: ":visible",
            },
            customize: function (win) {
              const formatDateRange = () => {
                const startDate = new Date(
                  $(startDateId).val()
                ).toLocaleDateString("vi-VN");
                const endDate = new Date($(endDateId).val()).toLocaleDateString(
                  "vi-VN"
                );
                return startDate && endDate
                  ? `(${startDate} - ${endDate})`
                  : "";
              };

              // Set common css styles for the print view
              const setCommonStyles = () => {
                $(win.document.body).find("th, td").css({
                  "font-size": "0.65rem",
                  border: "1px solid black",
                });
                $(win.document.body).find("h1,h5,h6").css({
                  "font-size": "small",
                });
                $(win.document.body).find("th").css({
                  "white-space": "nowrap",
                });
                $(win.document.body).find("hr").css({
                  margin: 0,
                });
                $(win.document.body).find("p").css({
                  fontSize: "0.6rem",
                });
              };

              const addHeaderInfo = (dateRange, supplierName) => {
                $(win.document.body)
                  .find("h1")
                  .css("text-align", "center")
                  .css("font-weight", "bold")
                  .after(`<h5 style="text-align: center;">${dateRange}</h5>`)
                  .end()
                  .find("h5")
                  .after(`<h6 style="text-align: left;">${supplierName}</h6>`);
              };

              // Table footer information
              const calculateTotalAmount = (
                table,
                areaDimension,
                areaPrice
              ) => {
                let totalAmount = 0;
                if (
                  parseNumber(areaDimension) > 0 &&
                  parseNumber(areaPrice) > 0
                ) {
                  const cellValue = $(table.column(24).footer())
                    .text()
                    .replace(/\./g, "")
                    .replace(",", ".");
                  totalAmount = parseFloat(cellValue) || 0;
                } else {
                  const footerRow = $(table.table().footer()).find("tr:last");
                  footerRow.find("th").each(function (index) {
                    if (index > 0 && index < 4) {
                      const cellValue = $(this)
                        .text()
                        .replace(/\./g, "")
                        .replace(",", ".");
                      totalAmount += parseFloat(cellValue) || 0;
                    }
                  });
                }
                return totalAmount;
              };

              const addFooterInfo = (
                win,
                totalAmount,
                addPrice,
                minusPrice,
                finalAmount,
                totalAfterRatio,
                debt,
                retainedAmount
              ) => {
                $(win.document.body)
                  .find("table")
                  .after(
                    `<p style="text-align: left; margin-top: 20px;">Tổng số tiền: ${totalAmount.toLocaleString(
                      "vi-VN"
                    )}</p>`,
                    addPrice > 0
                      ? `<p style="text-align: left; margin-top: 20px;">Cộng: ${addPrice.toLocaleString(
                          "vi-VN"
                        )}</p>`
                      : "",
                    minusPrice > 0
                      ? `<p style="text-align: left; margin-top: 20px;">Trừ: ${minusPrice.toLocaleString(
                          "vi-VN"
                        )}</p>`
                      : "",
                    addPrice > 0 || minusPrice > 0
                      ? `<p style="text-align: left; margin-top: 20px;">Tổng sau cộng/trừ: ${finalAmount.toLocaleString(
                          "vi-VN"
                        )}</p>`
                      : "",
                    ratioSumSplit < 100
                      ? `<p style="text-align: left; margin-top: 20px;">Tỉ lệ phân chia tổng: ${ratioSumSplit}%</p>`
                      : "",
                    `<hr>
                              <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                                <p style="text-align: left; width: 50%;">Thực nhận: ${totalAfterRatio.toLocaleString(
                                  "vi-VN"
                                )}</p>
                                <div style="display:flex; flex-direction: column; align-items: flex-end; width: 50%">
                                  ${
                                    debt > 0
                                      ? `<p>Công nợ còn lại: ${formatNumberForDisplay(
                                          debt,
                                          "vi-VN"
                                        )}</p>`
                                      : ""
                                  }
                                  ${
                                    retainedAmount > 0
                                      ? `<p>Tổng tiền giữ lại: ${formatNumberForDisplay(
                                          retainedAmount,
                                          "vi-VN"
                                        )}</p>`
                                      : ""
                                  }
                                </div>
                              </div>
                              <footer style=" display: block !important; position: fixed; bottom: 0; width: 100%;text-align: center; font-size: 0.7rem; padding: 10px;">Vui lòng mang theo phiếu nếu sai xót</footer>`
                  );
              };

              const dateRange = formatDateRange();
              const table = $(tableId).DataTable();

              if (exportPageFooter) {
                addHeaderInfo(dateRange, `Vườn: ${supplierName}`);
                setCommonStyles();
              }

              if (individualExportPage) {
                const totalAmount = calculateTotalAmount(
                  table,
                  areaDimension,
                  areaPrice
                );
                const addPrice = addPriceId
                  ? parseFloat(
                      $(addPriceId).val().replace(/\./g, "").replace(",", ".")
                    ) || 0
                  : 0;
                const minusPrice = minusPriceId
                  ? parseFloat(
                      $(minusPriceId).val().replace(/\./g, "").replace(",", ".")
                    ) || 0
                  : 0;
                const finalAmount = totalAmount + addPrice - minusPrice;
                const totalAfterRatio =
                  finalAmount * (ratioSumSplit.replace(",", ".") / 100);

                addHeaderInfo(dateRange, `Tên: ${supplierName}`);
                addFooterInfo(
                  win,
                  totalAmount,
                  addPrice,
                  minusPrice,
                  finalAmount,
                  totalAfterRatio,
                  debt,
                  retainedAmount
                );
                setCommonStyles();
              }
            },
          },
          {
            extend: "collection",
            text: "Chọn cột",
            collectionLayout: "fixed columns",
            popoverTitle: `<h4 class='m-0'>Chọn cột để hiện</h4><hr>`,
            buttons: [
              {
                extend: "colvis",
                text: "Chọn cột đơn",
                collectionLayout: "fixed columns",
              },
              ...(exportPageFooter && areaDimension > 0 && areaPrice > 0
                ? [
                    createColvisGroup(
                      "Thông tin nhà vườn",
                      [2, 3, 4, 5, 6, 7, 8, 9]
                    ),
                    createColvisGroup("Mủ nước", [10, 11, 12, 13, 14]),
                    createColvisGroup("Mủ tạp", [15, 16, 17, 18, 19]),
                    createColvisGroup("Mủ ké", [20, 21, 22, 23, 24]),
                    createColvisGroup("Mủ đông", [25, 26, 27, 28, 29]),
                  ]
                : []),
              ...(individualExportPage
                ? [
                    createColvisGroup(
                      "Mủ nước",
                      areaDimension > 0 && areaPrice > 0
                        ? [2, 3, 4, 5, 6, 7, 8]
                        : [2, 3, 4, 5]
                    ),
                    createColvisGroup(
                      "Mủ tạp",
                      areaDimension > 0 && areaPrice > 0
                        ? [9, 10, 11, 12, 13]
                        : [6, 7]
                    ),
                    createColvisGroup(
                      "Mủ ké",
                      areaDimension > 0 && areaPrice > 0
                        ? [14, 15, 16, 17, 18]
                        : [8, 9]
                    ),
                    createColvisGroup(
                      "Mủ đông",
                      areaDimension > 0 && areaPrice > 0
                        ? [19, 20, 21, 22, 23]
                        : [10, 11]
                    ),
                    {
                      extend: "colvisGroup",
                      text: "Chế độ in",
                      show: [2, 3, 4, 6],
                      hide: [0, 13, 5, 7, 9, 11],
                    },
                  ]
                : []),
              {
                extend: "colvisGroup",
                className: "selectAllColvisGroup",
                text: "Hiển thị tất cả",
                show: ":hidden",
                action: function (e, dt, node, config) {
                  const isActive = this.active();
                  // Deactivate all colvisGroup buttons
                  dt.buttons(".buttons-colvisGroup").active(false);
                  // Toggle the active state of this button
                  this.active(!isActive);
                  // Show or hide columns based on the new active state
                  dt.columns(config.columns).visible(!isActive);
                },
              },
            ],
          },
          {
            text: "Làm mới",
            action: function (e, dt, node, config) {
              dt.ajax.reload();
            },
          },
        ]
      : [],
    stateSave: true,
    serverSide: true,
    processing: true,
    lengthMenu: [10, 20, { label: "Tất cả", value: -1 }],
    paging: true,
    pagingType: "first_last_numbers",
    rowGroup: rowGroupOptions,
    ajax: {
      url: ajaxUrl,
      type: "POST",
      data: function (d) {
        d.startDate = $(startDateId).val();
        d.endDate = $(endDateId).val();

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
        next: "Sau",
        previous: "Trước",
      },
      search: "Tìm kiếm:",
      lengthMenu: "Hiển thị _MENU_ bản ghi",
      info: "Hiển thị _START_ đến _END_ của _TOTAL_ bản ghi",
      infoEmpty: "Hiển thị 0 đến 0 của 0 bản ghi",
      infoFiltered: "(lọc từ _MAX_ bản ghi)",
    },
    lengthMenu: [10, 20],
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
      return {
        ...column,
      };
    }),
    ...footerCallbackOptions,
  };

  const table = $(tableId).DataTable(tableOptions);

  $(filterButtonId).on("click", function () {
    table.ajax.reload();
  });

  $(clearFilterButton).on("click", function () {
    $(startDateId).val("");
    $(endDateId).val("");
    table.ajax.reload();
  });
}
