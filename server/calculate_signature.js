"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (arg) {
  var kDate, kRegion, kService, policy, region, secret, signature_key;
  policy = arg.policy, region = arg.region, secret = arg.secret;
  kDate = (0, _cryptoJs.HmacSHA256)((0, _moment2.default)().format("YYYYMMDD"), "AWS4" + secret);
  kRegion = (0, _cryptoJs.HmacSHA256)(region, kDate);
  kService = (0, _cryptoJs.HmacSHA256)("s3", kRegion);
  signature_key = (0, _cryptoJs.HmacSHA256)("aws4_request", kService);
  return (0, _cryptoJs.HmacSHA256)(policy, signature_key).toString(_cryptoJs2.default.enc.Hex);
};

var _cryptoJs = require("crypto-js");

var _cryptoJs2 = _interopRequireDefault(_cryptoJs);

var _moment = require("moment");

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

;