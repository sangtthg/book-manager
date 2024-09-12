function arrayToString(imageArray) {
  if (!Array.isArray(imageArray)) {
    return "";
  }
  return imageArray.join(",");
}

function stringToArray(imageString) {
  if (!imageString) return [];
  if (typeof imageString !== "string") {
    throw new Error("Input must be a string");
  }
  return imageString.split(",");
}

module.exports = { arrayToString, stringToArray };
