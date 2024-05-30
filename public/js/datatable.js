function initializeDataTable(tableId, ajaxUrl, modalTarget, columns) {
  $(tableId).DataTable({
    serverSide: true,
    processing: true,
    ajax: {
      url: ajaxUrl,
      type: "POST",
    },
    language: {
      emptyTable: "Không có dữ liệu",
      loadingRecords: "Đang tải...",
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
    lengthMenu: [5, 20],
    columns: columns.map((column) => {
      if (column.data === "id") {
        return {
          ...column,
          render: function (data, type, row) {
            return `
                <i
                    class="ri-edit-box-line"
                    data-bs-toggle="modal"
                    data-bs-target="${modalTarget}${row.no}"
                    style="cursor: pointer;"
                ></i>
            `;
          },
        };
      }
      return column;
    }),
  });
}
