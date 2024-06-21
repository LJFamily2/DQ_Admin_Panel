const trimStringFields = require('./utils/trimStringFields');
const handleResponse = require('./utils/handleResponse');
const formatNumberForDisplay = require('./utils/formatNumberForDisplay');
const DataModel = require('../models/dataModel');

module.exports = {
  renderPage,
  createData,
  getDatas,
  updateData,
};

async function renderPage(req, res) {
  try {
    const datas = await DataModel.find({});
    res.render('src/dataPage', {
      layout: './layouts/defaultLayout',
      datas,
      messages: req.flash(),
      title: 'Dữ liệu',
    });
  } catch (err) {
    console.log(err);
    res.status(500);
  }
}

async function createData(req, res) {
  req.body = trimStringFields(req.body);
  try {
    let date = await DataModel.findOne({ date: req.body.date });
    if (date) {
      handleResponse(
        req,
        res,
        404,
        'fail',
        'Đã có dữ liệu ngày này. Hãy chọn ngày khác!',
        req.headers.referer,
      );
    }

    console.log(req.body);
    products = {
      dryQuantity: parseFloat((req.body.dryQuantity || '0').replace(',', '.')),
      dryPercentage: parseFloat(
        (req.body.dryPercentage || '0').replace(',', '.'),
      ),
      mixedQuantity: parseFloat(
        (req.body.mixedQuantity || '0').replace(',', '.'),
      ),
    };
    const newData = await DataModel.create({
      ...req.body,
      products: products,
    });
    if (!newData) {
      handleResponse(
        req,
        res,
        404,
        'fail',
        'Tạo dữ liệu thất bại',
        req.headers.referer,
      );
    } else {
      handleResponse(
        req,
        res,
        200,
        'success',
        'Tạo dữ liệu thành công',
        req.headers.referer,
      );
    }
  } catch (error) {
    console.log(error);
    res.status(500);
  }
}

async function getDatas(req, res) {
  try {
    const { draw, start = 0, length = 10, search, order, columns, startDate, endDate } = req.body;

    const searchValue = search?.value?.toLowerCase() || '';
    const sortColumnIndex = order?.[0]?.column;
    let sortColumn = columns?.[sortColumnIndex]?.data;
    let sortDirection = order?.[0]?.dir === 'asc' ? 1 : -1;

    const filter = {};

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const totalRecords = await DataModel.countDocuments(filter);

    let data = await DataModel.find(filter);

    if (searchValue) {
      const searchColumns = ['dryQuantity', 'dryPercentage', 'mixedQuantity'];
      data = data.filter(item => {
        const itemDate = new Date(item.date);
        const formattedDate = `${itemDate.getDate().toString().padStart(2, '0')}/${(itemDate.getMonth() + 1).toString().padStart(2, '0')}/${itemDate.getFullYear()}`;
        return (
          formattedDate.includes(searchValue) ||
          (item.notes && item.notes.toLowerCase().includes(searchValue)) ||
          columns.some(column => {
            let columnValue;
            if (searchColumns.includes(column.data)) {
              columnValue = item.products[column.data]?.toString().toLowerCase();
            } else if (column.data === 'dryTotal') {
              const dryQuantity = parseFloat(item.products?.dryQuantity || 0);
              const dryPercentage = parseFloat(item.products?.dryPercentage || 0);
              const dryTotal = (dryQuantity * dryPercentage) / 100 || 0;
              columnValue = dryTotal.toString().replace('.', ',').toLowerCase();
            } else {
              columnValue = item[column.data]?.toString().toLowerCase();
            }
            return columnValue && columnValue.includes(searchValue);
          })
        );
      });
    }

    data.sort((a, b) => {
      const valueA = (sortColumn === 'date' ? new Date(a.date) : a.products[sortColumn]) || '';
      const valueB = (sortColumn === 'date' ? new Date(b.date) : b.products[sortColumn]) || '';
      return (valueA < valueB ? -sortDirection : (valueA > valueB ? sortDirection : 0));
    });

    const filteredRecords = data.length;

    const formattedData = data
      .slice(start, start + length)
      .map((item, index) => ({
        no: parseInt(start, 10) + index + 1,
        date: new Date(item.date).toLocaleDateString(),
        dryQuantity: formatNumberForDisplay(item.products.dryQuantity),
        dryPercentage: formatNumberForDisplay(item.products.dryPercentage),
        dryTotal: formatNumberForDisplay((item.products.dryQuantity * item.products.dryPercentage) / 100),
        mixedQuantity: formatNumberForDisplay(item.products.mixedQuantity),
        notes: item.notes || '',
        id: item._id,
      }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data: formattedData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
}



async function updateData(req, res) {
  const { id } = req.params;
  try {
    console.log(req.body);

    const products = {
      dryQuantity: req.body.dryQuantity
        ? parseFloat(req.body.dryQuantity.replace(',', '.'))
        : null,
      dryPercentage: req.body.dryPercentage
        ? parseFloat(req.body.dryPercentage.replace(',', '.'))
        : null,
      mixedQuantity: req.body.mixedQuantity
        ? parseFloat(req.body.mixedQuantity.replace(',', '.'))
        : null,
    };

    updateFields = {
      ...req.body,
      notes: req.body.notes,
      products,
    };

    console.log(updateFields);

    const newData = await DataModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true },
    );

    if (!newData) {
      handleResponse(
        req,
        res,
        404,
        'fail',
        'Cập nhật thông tin thất bại',
        req.headers.referer,
      );
    }
    handleResponse(
      req,
      res,
      200,
      'success',
      'Cập nhật thông tin thành công',
      req.headers.referer,
    );
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}
