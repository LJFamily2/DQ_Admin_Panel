document.addEventListener('DOMContentLoaded', async function () {
  const labels = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];

  const currentYear = new Date().getFullYear();
  const chartConfigs = [
    {
      url: '/tong/getRawMaterial',
      title: `Nguyên liệu mủ ${currentYear}`,
      chartId: 'myChart',
      spinnerId: 'spinner-myChart',
      datasetsConfig: [
        { label: 'Quy khô', color: 'rgba(92, 0, 121, 0.2)', borderColor: 'rgba(92, 0, 121, 1)', key: 'totalDryRubber' },
        { label: 'Mủ ké', color: 'rgba(96, 84, 90, 0.2)', borderColor: 'rgba(96, 84, 90, 1)', key: 'totalKeQuantity' },
        { label: 'Mủ tạp', color: 'rgba(32, 231, 201, 0.2)', borderColor: 'rgba(32, 231, 201, 1)', key: 'totalMixedQuantity' },
      ],
    },
    {
      url: '/tong/getProductData',
      title: `Dữ liệu chạy lò ${currentYear}`,
      chartId: 'productChart',
      spinnerId: 'spinner-productChart',
      datasetsConfig: [
        { label: 'Quy khô', color: 'rgba(92, 0, 121, 0.2)', borderColor: 'rgba(92, 0, 121, 1)', key: 'totalDryRubber' },
        { label: 'Thành phẩm', color: 'rgba(255, 179, 0, 0.2)', borderColor: 'rgba(255, 179, 0, 1)', key: 'totalQuantity' },
      ],
    },
    {
      url: '/tong/getRevenueAndSpending',
      title: `Thu nhập và chi tiêu ${currentYear}`,
      chartId: 'revenueAndSpendChart',
      spinnerId: 'spinner-revenueAndSpendChart',
      datasetsConfig: [
        { label: 'Thu nhập', color: '#0d6efd40', borderColor: '#0d6efd', key: 'totalRevenue' },
        { label: 'Chi tiêu', color: '#dc354540', borderColor: '#dc3545', key: 'totalSpending' },
      ],
    },
  ];

  for (const config of chartConfigs) {
    const data = await fetchData(config.url);
    const datasets = createDatasets(data, config.datasetsConfig);
    createProductsChart(config.chartId, config.title, labels, datasets);
    document.getElementById(config.spinnerId).classList.add('hidden');
  }
});

async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
}

function createDatasets(data, datasetsConfig) {
  const datasets = datasetsConfig.map(config => {
    const dataArray = new Array(12).fill(0);
    data.forEach(item => {
      dataArray[item.month - 1] = item[config.key];
    });
    return {
      label: config.label,
      data: dataArray,
      backgroundColor: config.color,
      borderColor: config.borderColor,
      borderWidth: 1,
      hoverBackgroundColor: config.borderColor,
    };
  });
  return datasets;
}

function createProductsChart(chartId, title, labels, datasets) {
  const ctx = document.getElementById(chartId).getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return value.toLocaleString('vi-VN');
            },
          },
        },
      },
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 25,
            weight: 'bold',
          },
        },
        legend: {
          display: true,
          position: 'bottom',
        },
      },
    },
  });
}

function downloadChart(chartId, filename) {
  const chartCanvas = document.getElementById(chartId);
  const tempCanvas = document.createElement('canvas');
  const tempContext = tempCanvas.getContext('2d');

  // Set the dimensions of the temporary canvas to match the chart canvas
  tempCanvas.width = chartCanvas.width;
  tempCanvas.height = chartCanvas.height;

  // Draw a white rectangle as the background
  tempContext.fillStyle = 'white';
  tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Draw the chart on top of the white background
  tempContext.drawImage(chartCanvas, 0, 0);

  // Create a download link
  const link = document.createElement('a');
  link.href = tempCanvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}