"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (arg) {
  var authorizer, deleteComplete, paths, ref, ref1;
  authorizer = arg.authorizer, paths = (ref = arg.paths) != null ? ref : [], deleteComplete = (ref1 = arg.deleteComplete) != null ? ref1 : _noop2.default;
  if (!authorizer) {
    throw new Error("authorizer is required");
  }
  return authorizer({
    paths: paths
  }, deleteComplete);
};

var _noop = require("lodash/noop");

var _noop2 = _interopRequireDefault(_noop);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

;