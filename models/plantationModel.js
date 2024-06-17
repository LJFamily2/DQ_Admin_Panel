const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
mongoose.plugin(slug);

const plantationSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  areaID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Khu Vực',
  },
  managerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Người Quản Lý',
  },
  code: {
    type: String,
  },
  contactDurationStart: {
    type: String,
  },
  contactDurationEnd: {
    type: String,
  },
  plantationArea: {
    type: String,
  },
  data: [
    {
      date: {
        type: Date,
      },
      notes: {
        type: String,
      },
      products: {
        dryRubber: {
          type: String,
        },
        dryQuantity: {
          type: Number,
        },
        dryPercentage: {
          type: Number,
        },
        mixedRubber: {
          type: String,
        },
        mixedQuantity: {
          type: Number,
        },
      },
    },
  ],
  slug: {
    type: String,
    slug: 'name',
  },
});

plantationSchema.methods.calculateRemainingDays = function () {
  if (this.contactDurationEnd) {
    const endDate = new Date(this.contactDurationEnd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let diffInTime = endDate.getTime() - today.getTime();
    let diffInDays = diffInTime / (1000 * 3600 * 24);

    let years = Math.floor(diffInDays / 365);
    diffInDays -= years * 365;
    let months = Math.floor(diffInDays / 30);
    diffInDays -= months * 30;
    let days = Math.floor(diffInDays);

    let remainingDay = '';
    if (years > 0) {
      remainingDay += `${years} năm, `;
    }
    if (months > 0) {
      remainingDay += `${months} tháng, `;
    }
    if (days > 0) {
      remainingDay += `${days} ngày`;
    }

    // If remainingDay is empty, it means there are no remaining days
    if (remainingDay === '') {
      return 'Hợp đồng hết hạn';
    }

    return remainingDay.trim();
  } else {
    return '';
  }
};

plantationSchema.methods.calculateContranctDuration = function () {
  if (this.contactDurationStart && this.contactDurationEnd) {
    const startDate = new Date(this.contactDurationStart);
    const endDate = new Date(this.contactDurationEnd);

    let diffInTime = endDate.getTime() - startDate.getTime();
    let diffInDays = diffInTime / (1000 * 3600 * 24);

    let years = Math.floor(diffInDays / 365);
    diffInDays -= years * 365;
    let months = Math.floor(diffInDays / 30);
    diffInDays -= months * 30;
    let days = Math.floor(diffInDays);

    let contractDuration = '';
    if (years > 0) {
      contractDuration += `${years} năm, `;
    }
    if (months > 0) {
      contractDuration += `${months} tháng, `;
    }
    if (days > 0) {
      contractDuration += `${days} ngày`;
    }

    return contractDuration.trim();
  }
};

plantationSchema.methods.calculateTotalRemainingDays = function () {
  if (this.contactDurationEnd) {
    const endDate = new Date(this.contactDurationEnd);
    const today = new Date();

    let diffInTime = endDate.getTime() - today.getTime();
    let diffInDays = diffInTime / (1000 * 3600 * 24);

    return Math.floor(diffInDays);
  } else {
    return 0;
  }
};

const plantationModel = mongoose.model('Vườn', plantationSchema);

module.exports = plantationModel;
