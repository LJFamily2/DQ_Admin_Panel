const trimStringFields = require('./utils/trimStringFields');
const handleResponse = require('./utils/handleResponse');
const formatNumberForDisplay = require('./utils/formatNumberForDisplay');
const RawMaterialModel = require('../models/rawMaterialModel');
const ProductTotalModel = require('../models/productTotalModel');
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
      messages: req.flash(),
      title: 'Dữ liệu',
    });
  } catch (err) {
    console.log(err);
    res.status(500);
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
    const newData = await RawMaterialModel.create({
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
    }

    const totalDryRubber = calculateTotalDryRubber(products);

    console.log(totalDryRubber);

    const total = await updateProductTotal({ products }, 'add');

    if (!total) {
      handleResponse(
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
  } catch (error) {
    console.log(error);
    res.status(500);
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
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
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
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
}

async function updateData(req, res) {
  const { id } = req.params;

  try {
    console.log(req.body);

    const {
      dryQuantity = null,
      dryPercentage = null,
      mixedQuantity = null,
    } = req.body;
    const products = {
      dryQuantity: dryQuantity
        ? parseFloat(dryQuantity.replace(',', '.'))
        : null,
      dryPercentage: dryPercentage
        ? parseFloat(dryPercentage.replace(',', '.'))
        : null,
      mixedQuantity: mixedQuantity
        ? parseFloat(mixedQuantity.replace(',', '.'))
        : null,
    };

    // Prepare the fields to be updated
    const updateFields = {
      ...req.body,
      notes: req.body.notes,
      products,
    };

    console.log(updateFields);

    // Retrieve the old data before updating
    const oldData = await RawMaterialModel.findById(id);

    // Update the data with new values
    const newData = await RawMaterialModel.findByIdAndUpdate(
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
      return; // Exit if newData is not found
    }

    // Destructuring for cleaner access to product properties
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

    console.log(dryQuantityDiff, mixedQuantityDiff, dryPercentageDiff);

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
      handleResponse(
        req,
        res,
        404,
        'fail',
        'Cập nhật thông tin thất bại',
        req.headers.referer,
      );
      return;
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

async function deleteData(req, res) {
  try {
    const { id } = req.params;

    // Find the data to be deleted
    const data = await RawMaterialModel.findByIdAndDelete(id);

    if (!data) {
      handleResponse(
        req,
        res,
        404,
        'fail',
        'Xóa dữ liệu thất bại',
        req.headers.referer,
      );
      return;
    }

    // Calculate the total dry rubber to be subtracted
    const totalDryRubber = calculateTotalDryRubber(data.products);

    // Update the ProductTotal document efficiently
    await updateProductTotal({ products: data.products }, 'subtract'); // Pass data.products directly

    console.log(
      `Deleted data with ${totalDryRubber} dry rubber and ${data.products.mixedQuantity} mixed quantity.`,
    ); // Informative message

    handleResponse(
      req,
      res,
      200,
      'success',
      'Xóa dữ liệu thành công',
      req.headers.referer,
    );
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}
