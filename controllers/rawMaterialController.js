const trimStringFields = require('./utils/trimStringFields');
const handleResponse = require('./utils/handleResponse');
const formatNumberForDisplay = require('./utils/formatNumberForDisplay');
const RawMaterialModel = require('../models/rawMaterialModel');
const ProductTotalModel = require('../models/productTotalModel');
const convertToDecimal = require('./utils/convertToDecimal')
const formatTotalData = require('./utils/formatTotalData');

module.exports = {
  renderPage,
  createData,
  getDatas,
  updateData,
  deleteData,
};

async function renderPage(req, res) {
  try {
    let totalData = await ProductTotalModel.find();
    const total = formatTotalData(totalData)
    
    const datas = await RawMaterialModel.find({});
    res.render('src/rawMaterialPage', {
      layout: './layouts/defaultLayout',
      datas,
      total,
      user: req.user,
      messages: req.flash(),
      title: 'Dữ liệu',
    });
  } catch  {
    res.status(500).render('partials/500');
  }
}

function calculateTotalDryRubber(product) {
  return parseFloat(
    ((product.dryQuantity * product.dryPercentage) / 100).toFixed(2),
  );
}
async function updateProductTotal(data, operation) {
  const totalDryRubber = calculateTotalDryRubber(data.products);
  const updateData = {
    $inc: {
      dryRubber: operation === 'add' ? totalDryRubber : -totalDryRubber,
      mixedQuantity:
        operation === 'add'
          ? data.products.mixedQuantity
          : -data.products.mixedQuantity,
    },
  };

  const total = await ProductTotalModel.findOneAndUpdate({}, updateData, {
    new: true,
    upsert: true,
  });
  return total;
}

async function createData(req, res) {
  req.body = trimStringFields(req.body);
  try {
    let date = await RawMaterialModel.findOne({ date: req.body.date });
    if (date) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Đã có dữ liệu ngày này. Hãy chọn ngày khác!',
        req.headers.referer,
      );
    }

    products = {
      dryQuantity: convertToDecimal(req.body.dryQuantity.trim()) || 0,
      dryPercentage: convertToDecimal(
        (req.body.dryPercentage.trim()) || 0 ,
      ),
      mixedQuantity: convertToDecimal(
        (req.body.mixedQuantity.trim()) || 0,
      ),
    };
    const newData = await RawMaterialModel.create({
      ...req.body,
      products: products,
    });
    if (!newData) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Tạo dữ liệu thất bại',
        req.headers.referer,
      );
    }

    calculateTotalDryRubber(products);


    const total = await updateProductTotal({ products }, 'add');

    if (!total) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Tạo dữ liệu thất bại',
        req.headers.referer,
      );
    }

    handleResponse(
      req,
      res,
      200,
      'success',
      'Tạo dữ liệu thành công',
      req.headers.referer,
    );
  } catch  {
    res.status(500).render('partials/500');
  }
}

async function getDatas(req, res) {
  try {
    const {
      draw,
      start = 0,
      length = 10,
      search,
      order,
      columns,
      startDate,
      endDate,
    } = req.body;

    const searchValue = search?.value?.toLowerCase() || '';
    const sortColumnIndex = order?.[0]?.column;
    let sortColumn = columns?.[sortColumnIndex]?.data;
    let sortDirection = order?.[0]?.dir === 'asc' ? 1 : -1;


    const filter = {};

    if (startDate && endDate) {
      const filterStartDate = new Date(startDate);
      const filterEndDate = new Date(endDate);
      filterEndDate.setHours(0, 0, 0);

      filter.date = {
        $gte: filterStartDate,
        $lte: filterEndDate,
      };
    }
    const totalRecords = await RawMaterialModel.countDocuments(filter);

    let data = await RawMaterialModel.find(filter);

    if (searchValue) {
      const searchColumns = ['dryQuantity', 'dryPercentage', 'mixedQuantity'];
      data = data.filter(item => {
        const itemDate = new Date(item.date);
        const formattedDate = `${itemDate
          .getDate()
          .toString()
          .padStart(2, '0')}/${(itemDate.getMonth() + 1)
          .toString()
          .padStart(2, '0')}/${itemDate.getFullYear()}`;
        return (
          formattedDate.includes(searchValue) ||
          (item.notes && item.notes.toLowerCase().includes(searchValue)) ||
          columns.some(column => {
            let columnValue;
            if (searchColumns.includes(column.data)) {
              columnValue = item.products[column.data]
                ?.toString()
                .toLowerCase();
            } else if (column.data === 'dryTotal') {
              const dryQuantity = parseFloat(item.products?.dryQuantity || 0);
              const dryPercentage = parseFloat(
                item.products?.dryPercentage || 0,
              );
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
      const valueA =
        (sortColumn === 'date' ? new Date(a.date) : a.products[sortColumn]) ||
        '';
      const valueB =
        (sortColumn === 'date' ? new Date(b.date) : b.products[sortColumn]) ||
        '';
      return valueA < valueB
        ? -sortDirection
        : valueA > valueB
        ? sortDirection
        : 0;
    });

    const filteredRecords = data.length;

    const formattedData = data
      .slice(start, start + length)
      .map((item, index) => ({
        no: parseInt(start, 10) + index + 1,
        date: new Date(item.date).toLocaleDateString(),
        plantation: item.plantation || "",
        dryQuantity: formatNumberForDisplay(item.products.dryQuantity),
        dryPercentage: formatNumberForDisplay(item.products.dryPercentage),
        dryTotal: formatNumberForDisplay(
          (item.products.dryQuantity * item.products.dryPercentage) / 100,
        ),
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
  } catch {
    res.status(500).render('partials/500');
  }
}

async function updateData(req, res) {
  const { id } = req.params;

  try {
    const products = {
      dryQuantity: convertToDecimal(req.body.dryQuantity.trim()) || 0,
      dryPercentage: convertToDecimal(
        (req.body.dryPercentage.trim()) || 0 ,
      ),
      mixedQuantity: convertToDecimal(
        (req.body.mixedQuantity.trim()) || 0,
      ),
    };

    // Prepare the fields to be updated
    const updateFields = {
      ...req.body,
      notes: req.body.notes,
      products,
    };


    // Retrieve the old data before updating
    const oldData = await RawMaterialModel.findById(id);

    // Update the data with new values
    const newData = await RawMaterialModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true },
    );

    if (!newData) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Cập nhật thông tin thất bại',
        req.headers.referer,
      );
    }

    const {
      dryQuantity: newDryQuantity,
      dryPercentage: newDryPercentage,
      mixedQuantity: newMixedQuantity,
    } = newData.products;
    const {
      dryQuantity: oldDryQuantity = 0,
      dryPercentage: oldDryPercentage = 0,
      mixedQuantity: oldMixedQuantity = 0,
    } = oldData.products || {};

    // Calculate differences in one step using nullish coalescing operator
    const dryQuantityDiff = newDryQuantity - oldDryQuantity;
    const mixedQuantityDiff = newMixedQuantity - oldMixedQuantity;
    const dryPercentageDiff = newDryPercentage - oldDryPercentage;


    const updateData = { $inc: { mixedQuantity: mixedQuantityDiff } };

    // Update dryRubber if there's a difference in dry quantity or percentage
    if (dryQuantityDiff !== 0 || dryPercentageDiff !== 0) {
      const newTotalDryRubberDiff =
        parseFloat(((newDryQuantity * newDryPercentage) / 100).toFixed(2)) -
        parseFloat(((oldDryQuantity * oldDryPercentage) / 100).toFixed(2));
      updateData.$inc.dryRubber = newTotalDryRubberDiff;
    }

    // Perform the update
    const total = await ProductTotalModel.findOneAndUpdate({}, updateData, {
      new: true,
      upsert: true,
    });

    if (!total) {
      return handleResponse(
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
  } catch  {
    res.status(500).render('partials/500');
  }
}

async function deleteData(req, res) {
  try {
    const { id } = req.params;

    // Find the data to be deleted
    const data = await RawMaterialModel.findByIdAndDelete(id);

    if (!data) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Xóa dữ liệu thất bại',
        req.headers.referer,
      );
    }

    // Calculate the total dry rubber to be subtracted
    calculateTotalDryRubber(data.products);

    // Update the ProductTotal document efficiently
    await updateProductTotal({ products: data.products }, 'subtract'); 

    handleResponse(
      req,
      res,
      200,
      'success',
      'Xóa dữ liệu thành công',
      req.headers.referer,
    );
  } catch {
    res.status(500).render('partials/500');
  }
}
