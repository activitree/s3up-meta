/* eslint-disable camelcase */

'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})

var _typeof = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? function (obj) { return typeof obj } : function (obj) { return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ? 'symbol' : typeof obj }

exports.default = function (file, arg) {
  var _id, acl, authorizer, bucket, encoding, expiration, extension, file_data, file_name, path, ref, ref1, ref2, ref3, ref4, region, upload_event, cache_control, expires
  _id = (ref = arg._id) != null ? ref : (0, _v2.default)(), encoding = (ref1 = arg.encoding) != null ? ref1 : '', file_name = (ref2 = arg.file_name) != null ? ref2 : true, authorizer = arg.authorizer, path = arg.path, acl = arg.acl, bucket = arg.bucket, region = arg.region, expiration = arg.expiration,
  cache_control = (arg && arg.metadata && arg.metadata.CacheControl) || 'no-cache', expires = (arg && arg.metadata && arg.metadata.Expires) || '0', upload_event = (ref3 = arg.upload_event) != null ? ref3 : _noop2.default
  if (!authorizer) {
    throw new Error('authorizer is required')
  }
  if (encoding === 'base64' && (0, _isString2.default)(file)) {
    file = (0, _b64toBlob2.default)(file)
  }
  switch (typeof file_name === 'undefined' ? 'undefined' : _typeof(file_name)) {
    case 'boolean':
      extension = (0, _last2.default)((ref4 = file.name) != null ? ref4.split('.') : void 0)
      if (!extension) {
        extension = file.type.split('/')[1]
      }
      file_name = (0, _v2.default)() + '.' + extension
      break
    case 'function':
      file_name = file_name(file)
  }
  if ((0, _isEmpty2.default)(file_name)) {
    file_name = file.name
  }
  file_data = {
    _id: _id,
    file: {
      name: file_name,
      type: file.type,
      size: file.size,
      original_name: file.name,
      cache_control,
      expires
    },
    loaded: 0,
    total: file.size,
    percent_uploaded: 0,
    status: 'authorizing'
  }
  upload_event(null, file_data)
  return authorizer({
    path: path,
    acl: acl,
    bucket: bucket,
    region: region,
    expiration: expiration,
    file_name: file_name,
    file_type: file.type,
    file_size: file.size
  }, function (error, signature) {
    var form_data, xhr
    if (error) {
      throw error
    }
    form_data = new FormData()
    form_data.append('key', signature.key)
    form_data.append('acl', signature.acl)
    form_data.append('Content-Type', signature.file_type)
    if (cache_control) {
      form_data.append('Cache-Control', cache_control)
    }
    if (expires) {
      form_data.append('Expires', expires)
    }
    form_data.append('X-Amz-Date', signature.meta_date)
    form_data.append('x-amz-meta-uuid', signature.meta_uuid)
    form_data.append('X-Amz-Algorithm', 'AWS4-HMAC-SHA256')
    form_data.append('X-Amz-Credential', signature.meta_credential)
    form_data.append('X-Amz-Signature', signature.signature)
    form_data.append('Policy', signature.policy)
    form_data.append('file', file)
    xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('progress', function (event) {
      Session.set('glimpseUp', Math.floor(event.loaded / event.total * 100))
      return upload_event(null, (0, _extend2.default)(file_data, {
        loaded: event.loaded,
        total: event.total,
        percent_uploaded: Math.floor(event.loaded / event.total * 100),
        status: 'uploading'
      }))
    }, false)
    xhr.addEventListener('load', function () {
      if (xhr.status < 400) {
        delete Session.keys.glimpseUp
        return upload_event(null, (0, _extend2.default)(file_data, {
          percent_uploaded: 100,
          url: signature.url,
          secure_url: signature.secure_url,
          relative_url: signature.relative_url,
          status: 'complete'
        }))
      } else {
        return upload_event(new Error('Upload Failed Request Failed'), (0, _extend2.default)(file_data, {
          status: 'error'
        }))
      }
    })
    xhr.addEventListener('error', function () {
      return upload_event(new Error('Upload Failed Network Error'), (0, _extend2.default)(file_data, {
        status: 'error'
      }))
    })
    xhr.addEventListener('abort', function () {
      return upload_event(new Error('Upload Failed User Aborted'), (0, _extend2.default)(file_data, {
        status: 'abort'
      }))
    })
    xhr.open('POST', signature.post_url, true)
    return xhr.send(form_data)
  })
}

var _b64toBlob = require('./b64toBlob')

var _b64toBlob2 = _interopRequireDefault(_b64toBlob)

var _v = require('uuid/v4')

var _v2 = _interopRequireDefault(_v)

var _isString = require('lodash.isstring')

var _isString2 = _interopRequireDefault(_isString)

var _last = require('lodash.last')

var _last2 = _interopRequireDefault(_last)

var _isEmpty = require('lodash.isempty')

var _isEmpty2 = _interopRequireDefault(_isEmpty)

var _noop = require('lodash.noop')

var _noop2 = _interopRequireDefault(_noop)

var _extend = require('lodash.assignin')

var _extend2 = _interopRequireDefault(_extend)

function _interopRequireDefault (obj) { return obj && obj.__esModule ? obj : { default: obj } }
