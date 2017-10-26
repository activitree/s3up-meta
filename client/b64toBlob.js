"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (b64Data, contentType, sliceSize) {
  var blob, byteArray, byteArrays, byteCharacters, byteNumbers, data, i, j, k, offset, ref, ref1, ref2, slice;
  data = b64Data.split("base64,");
  if (!contentType) {
    contentType = data[0].replace("data:", "").replace(";", "");
  }
  contentType = contentType;
  sliceSize = sliceSize || 512;
  byteCharacters = atob(data[1]);
  byteArrays = [];
  for (offset = j = 0, ref = byteCharacters.length, ref1 = sliceSize; ref1 > 0 ? j < ref : j > ref; offset = j += ref1) {
    slice = byteCharacters.slice(offset, offset + sliceSize);
    byteNumbers = new Array(slice.length);
    for (i = k = 0, ref2 = slice.length; 0 <= ref2 ? k < ref2 : k > ref2; i = 0 <= ref2 ? ++k : --k) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  blob = new Blob(byteArrays, {
    type: contentType
  });
  return blob;
};

;