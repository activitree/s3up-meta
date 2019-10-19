/* eslint-disable camelcase */

'use strict'
import dayjs from 'dayjs'
import s3 from 'aws-sdk/clients/s3'
import future from 'fibers/future'

Object.defineProperty(exports, '__esModule', {
  value: true
})

var _calculate_signature = require('./calculate_signature')

var _calculate_signature2 = _interopRequireDefault(_calculate_signature)

var _v = require('uuid/v4')

var _v2 = _interopRequireDefault(_v)

var _dayjs = dayjs

var _dayjs2 = _interopRequireDefault(_dayjs)

var _isEmpty = require('lodash.isempty')

var _isEmpty2 = _interopRequireDefault(_isEmpty)

var _s = s3

var _s2 = _interopRequireDefault(_s)

var _future = future

var _future2 = _interopRequireDefault(_future)

function _interopRequireDefault (obj) { return obj && obj.__esModule ? obj : { default: obj } }

var Authorizer

/**
 * Creates an object for the client to consume as a signature to authorize a file upload into Amazon S3
 * @param {Object} ops Object describing how to create the signature
 * @param {Number} ops.expiration For how long is the signature valid?
 * @param {String} ops.path Where are we saving this to? A blank string is root, a folder is described without a starting or trailing slash
 * @param {String} ops.file_type What type of file is it?
 * @param {String} ops.file_name What name do you want the file to have?
 * @param {Number} ops.file_size How large is the file?
 * @param {String} ops.acl How will the file be accessed? ['private', 'public-read', 'public-read-write', 'authenticated-read', 'bucket-owner-read', 'bucket-owner-full-control', 'log-delivery-write']
 * @param {String} ops.bucket The target Amazon AWS S3 bucket
 * @param {String} ops.region The region that your Amazon AWS S3 bucket belongs to
 * @return {Object}               Returns the signature object to use for uploading
 */

Authorizer = function () {
  function Authorizer (arg) {
    var ref, ref1, ref2, ref3
    this.secret = arg.secret, this.key = arg.key, this.bucket = arg.bucket, this.region = (ref = arg.region) != null ? ref : 'us-east-1', this.path = (ref1 = arg.path) != null ? ref1 : '', this.expiration = (ref2 = arg.expiration) != null ? ref2 : 1800000, this.acl = (ref3 = arg.acl) != null ? ref3 : 'public-read'
    this.SDK = new _s2.default({
      secretAccessKey: this.secret,
      accessKeyId: this.key,
      bucket: this.bucket,
      region: this.region
    })
  }

  Authorizer.prototype.authorize_upload = function (arg, metadata) {
    var acl, bucket, expiration, expiration_date, file_name, file_size, file_type, key, meta_credential, meta_date, meta_uuid, path, policy, post_url, ref, ref1, ref2, ref3, ref4, region, signature, cache_control, expires
    expiration = (ref = arg.expiration) != null ? ref : this.expiration, path = (ref1 = arg.path) != null ? ref1 : this.path, file_type = arg.file_type, file_name = arg.file_name, file_size = arg.file_size, acl = (ref2 = arg.acl) != null ? ref2 : this.acl, bucket = (ref3 = arg.bucket) != null ? ref3 : this.bucket, region = (ref4 = arg.region) != null ? ref4 : this.region,
      cache_control = (metadata && metadata.CacheControl) || 'no-cache', expires = (metadata && metadata.Expires) || '0'

    if ((0, _isEmpty2.default)(file_name)) {
      throw new Error('file_name cannot be empty')
    }
    if ((0, _isEmpty2.default)(file_type)) {
      throw new Error('file_type cannot be empty')
    }
    if (isFinite(file_size) && file_size <= 0) {
      throw new Error('file_size cannot be less than or equal to 0')
    }
    expiration_date = new Date(Date.now() + expiration)
    expiration_date = expiration_date.toISOString()
    if ((0, _isEmpty2.default)(path)) {
      key = '' + file_name
    } else {
      key = path + '/' + file_name
    }
    meta_uuid = (0, _v2.default)()
    meta_date = (0, _dayjs2.default)().format('YYYYMMDD') + 'T000000Z'
    meta_credential = this.key + '/' + (0, _dayjs2.default)().format('YYYYMMDD') + '/' + region + '/s3/aws4_request'

    policy = {
      'expiration': expiration_date,
      'conditions': [['content-length-range', 0, file_size], {
        'key': key
      }, {
        'bucket': bucket
      }, {
        'Content-Type': file_type
      }, {
        'Cache-Control': cache_control
      }, {
        'Expires': expires
      }, {
        'acl': acl
      }, {
        'x-amz-algorithm': 'AWS4-HMAC-SHA256'
      }, {
        'x-amz-credential': meta_credential
      }, {
        'x-amz-date': meta_date
      }, {
        'x-amz-meta-uuid': meta_uuid
      }]
    }
    policy = new Buffer(JSON.stringify(policy), 'utf-8').toString('base64')
    signature = (0, _calculate_signature2.default)({
      policy: policy,
      region: region,
      secret: this.secret
    })
    if (region === 'us-standard') {
      region = 'us-east-1'
    }
    post_url = 'https://s3-' + region + '.amazonaws.com/' + bucket
    return {
      policy: policy,
      signature: signature,
      access_key: this.key,
      post_url: post_url,
      url: (post_url + '/' + key).replace('https://', 'http://'),
      secure_url: post_url + '/' + key,
      relative_url: '/' + key,
      bucket: bucket,
      acl: acl,
      key: key,
      file_type: file_type,
      file_name: file_name,
      file_size: file_size,
      meta_uuid: meta_uuid,
      meta_date: meta_date,
      meta_credential: meta_credential
    }
  }

  Authorizer.prototype.authorize_delete = function (arg) {
    let delete_params, delete_promise, future, paths, ref
    paths = (ref = arg.paths) != null ? ref : []
    if (!Array.isArray(paths)) {
      paths = [paths]
    }
    paths = paths.map(function (path) {
      return {
        Key: path
      }
    })
    delete_params = {
      Bucket: this.bucket,
      Delete: {
        Objects: paths
      }
    }
    delete_promise = this.SDK.deleteObjects(delete_params).promise()
    future = new _future2.default()
    delete_promise.then(function (err, res) {
      if ((res != null ? res.Errors.length : void 0) > 0) {
        return future['return'](new Error(res.Errors), null)
      } else {
        return future['return'](err, res)
      }
    })
    return future.wait()
  }

  return Authorizer
}()

exports.default = Authorizer
