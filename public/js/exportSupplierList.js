async function exportSupplierList() {
  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Danh sách nhà vườn");

  // Add headers
  worksheet.columns = [
    {
      header: "Mã nhà vườn",
      key: "code",
      width: 15,
    },
    {
      header: "Tên nhà vườn",
      key: "name",
      width: 30,
    },
  ];

  // Get all suppliers from the list
  const supplierList = document.querySelectorAll("#supplierList li");

  // Add data rows
  supplierList.forEach((supplier) => {
    const name = supplier
      .querySelector(".fw-bold")
      .textContent.trim()
      .replace("(Quản lý)", "")
      .trim();
    const code = supplier
      .querySelector(".supplier-name")
      .textContent.trim()
      .split("\n")
      .pop()
      .trim();

    worksheet.addRow({
      name: name,
      code: code,
    });
  });

  // Style the header row
  worksheet.getRow(1).font = {
    bold: true,
  };

  // Generate and download the Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `danh-sach-nha-vuon-${
    new Date().toISOString().split("T")[0]
  }.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}
