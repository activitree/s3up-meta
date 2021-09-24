import calculate_signature from "./calculate_signature"
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import isEmpty from 'lodash.isempty'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

/**
 * Creates an object for the client to consume as a signature to authorize a file upload into Amazon S3
 * @param {Object} ops Object describing how to create the signature
 * @param {Number} ops.expiration For how long is the signature valid?
 * @param {String} ops.path Where are we saving this to? A blank string is root, a folder is described without a starting or trailing slash
 * @param {String} ops.file_type What type of file is it?
 * @param {String} ops.file_name What name do you want the file to have?
 * @param {Number} ops.file_size How large is the file?
 * @param {String} ops.acl How will the file be accessed? ["private", "public-read", "public-read-write", "authenticated-read", "bucket-owner-read", "bucket-owner-full-control", "log-delivery-write"]
 * @param {String} ops.bucket The target Amazon AWS S3 bucket
 * @param {String} ops.region The region that your Amazon AWS S3 bucket belongs to
 * @return {Object}               Returns the signature object to use for uploading
 */
class Authorizer {
  constructor({ secret = '', key = '', bucket = '', region = 'us-east-1', path = '', expiration = 1800000, acl = 'public-read'}) {
    this.secret = secret
    this.key = key
    this.bucket = bucket
    this.region = region
    this.path = path
    this.expiration = expiration
    this.acl = acl
    this.SDK = new S3Client({
      secretAccessKey: secret,
      accessKeyId: key,
      bucket: bucket,
      region: region
    })
  }

  authorizeUpload({ expiration = this.expiration, path = this.path , file_type, file_name, file_size, acl = this.acl, bucket = this.bucket, region = this.region }, metadata) {
    if (isEmpty(file_name)) {
      throw new Error('file_name cannot be empty')
    }

    if (isEmpty(file_type)) {
      throw new Error('file_type cannot be empty')
    }

    if (isFinite(file_size) && (file_size <= 0)) {
      throw new Error('file_size cannot be less than or equal to 0')
    }

    const cache_control = (metadata && metadata.CacheControl) || 'no-cache'
    const expires = (metadata && metadata.Expires) || '0'

    let expiration_date = new Date(Date.now() + expiration)
    expiration_date = expiration_date.toISOString()

    let key
    if (isEmpty(path)) {
      key = `${file_name}`
    } else {
      key = `${path}/${file_name}`
    }

    const meta_uuid = uuidv4();
    const meta_date = `${dayjs().format('YYYYMMDD')}T000000Z`
    const meta_credential = `${this.key}/${dayjs().format('YYYYMMDD')}/${region}/s3/aws4_request`
    let policy = {
      'expiration':expiration_date,
      'conditions':[
        ['content-length-range',0,file_size],
        {key},
        {bucket},
        {'Content-Type': file_type},
        {'Cache-Control': cache_control},
        {'Expires': expires},
        {acl},
        // {'x-amz-server-side-encryption': 'AES256'}
        {'x-amz-algorithm': 'AWS4-HMAC-SHA256'},
        {'x-amz-credential': meta_credential},
        {'x-amz-date': meta_date},
        {'x-amz-meta-uuid': meta_uuid}
      ]
    }

    // Encode the policy
    policy = new Buffer(JSON.stringify(policy), "utf-8").toString("base64")

    // Sign the policy
    const signature = calculate_signature({
      policy,
      region,
      secret: this.secret
    })

    // Identify post_url
    if (region === 'us-standard') { // This region does not exist but I can see how people can be confused about it
      region = 'us-east-1'
    }

    let post_url
    if (region === 'us-east-1') {
      post_url = `https://s3.amazonaws.com/${bucket}`
    } else {
      post_url = `https://s3-${region}.amazonaws.com/${bucket}`
    }

    // Return authorization object
    return {
      policy,
      signature,
      access_key:this.key,
      post_url,
      url:`${post_url}/${key}`.replace('https://','http://'),
      secure_url:`${post_url}/${key}`,
      relative_url:`/${key}`,
      bucket,
      acl,
      key,
      file_type,
      file_name,
      file_size,
      meta_uuid,
      meta_date,
      meta_credential
    }
  }

  deleteServerSide({ paths = [] }) {
    if (!Array.isArray(paths)) {
      paths = [paths]
    }
    paths = paths.map(path => ({
      Key:path
    }))

    const input = {
      Bucket: this.bucket,
      Delete: {
        Objects: paths,
        Quiet: true
      }
    }

    const command = new DeleteObjectCommand(input)
    this.SDK.send(command, err => {
      if (err) { console.log(err) }
    })
  }
}

export default Authorizer
