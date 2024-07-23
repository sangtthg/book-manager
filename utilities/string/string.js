function arrayToString(imageArray) {
  if (!Array.isArray(imageArray)) {
    throw new Error("Input must be an array");
  }
  return imageArray.join(",");
}

function stringToArray(imageString) {
  if (typeof imageString !== "string") {
    throw new Error("Input must be a string");
  }
  return imageString.split(",");
}

module.exports = { arrayToString, stringToArray };
