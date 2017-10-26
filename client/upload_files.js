"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (files, ops) {
  var files_data, number_of_files, total_percent_uploaded, _upload_event;
  number_of_files = files.length;
  _upload_event = ops.upload_event;
  total_percent_uploaded = 0;
  files_data = [];
  return (0, _times2.default)(number_of_files, function (n) {
    return (0, _upload_file2.default)(files.item(n), (0, _extend2.default)(ops, {
      upload_event: function upload_event(err, res) {
        var all_files_complete, file_index, upload_size;
        if (err) {
          if (typeof _upload_event === "function") {
            _upload_event(err, (0, _extend2.default)(res, {
              total_percent_uploaded: total_percent_uploaded
            }));
          }
          total_percent_uploaded = 0;
          return;
        }
        if (res.status === "authorizing") {
          files_data.push(res);
        }
        if (res.status === "uploading") {
          file_index = (0, _findIndex2.default)(files_data, {
            _id: res._id
          });
          (0, _extend2.default)(files[file_index], res);
          upload_size = (0, _reduce2.default)(files_data, function (total, file) {
            return total + file.total;
          }, 0);
          total_percent_uploaded = (0, _reduce2.default)(files_data, function (total, file) {
            return total + Math.floor(file.loaded / file.total * (file.total / upload_size) * 100);
          }, 0);
        }
        all_files_complete = (0, _every2.default)(files_data, {
          status: "complete"
        });
        if (all_files_complete) {
          total_percent_uploaded = 100;
        }
        return typeof _upload_event === "function" ? _upload_event(null, (0, _extend2.default)(res, {
          total_percent_uploaded: total_percent_uploaded
        })) : void 0;
      }
    }));
  });
};

var _upload_file = require("./upload_file");

var _upload_file2 = _interopRequireDefault(_upload_file);

var _times = require("lodash/times");

var _times2 = _interopRequireDefault(_times);

var _extend = require("lodash/extend");

var _extend2 = _interopRequireDefault(_extend);

var _findIndex = require("lodash/findIndex");

var _findIndex2 = _interopRequireDefault(_findIndex);

var _reduce = require("lodash/reduce");

var _reduce2 = _interopRequireDefault(_reduce);

var _every = require("lodash/every");

var _every2 = _interopRequireDefault(_every);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

;