'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})
exports.uploadFiles = exports.uploadFile = exports.deleteFiles = undefined

var _deleteFiles = require('./delete_files')

var _deleteFiles2 = _interopRequireDefault(_deleteFiles)

var _uploadFiles = require('./upload_files')

var _uploadFiles2 = _interopRequireDefault(_uploadFiles)

var _uploadFile = require('./upload_file')

var _uploadFile2 = _interopRequireDefault(_uploadFile)

function _interopRequireDefault (obj) { return obj && obj.__esModule ? obj : { default: obj } }

exports.deleteFiles = _deleteFiles2.default
exports.uploadFile = _uploadFile2.default
exports.uploadFiles = _uploadFiles2.default
