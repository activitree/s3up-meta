'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.upload_files = exports.upload_file = exports.delete_files = undefined;

var _delete_files = require('./delete_files');

var _delete_files2 = _interopRequireDefault(_delete_files);

var _upload_files = require('./upload_files');

var _upload_files2 = _interopRequireDefault(_upload_files);

var _upload_file = require('./upload_file');

var _upload_file2 = _interopRequireDefault(_upload_file);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.delete_files = _delete_files2.default;
exports.upload_file = _upload_file2.default;
exports.upload_files = _upload_files2.default;