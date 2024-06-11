function trimStringFields(obj) {
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].trim();
      if (obj[key] === "") {
        delete obj[key];
      }
    }
  }
  return obj;
}

module.exports = trimStringFields;