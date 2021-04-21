/* globals Session */
import b64toBlob from './b64toBlob'
import { v4 as uuidv4 } from 'uuid'

import isString from 'lodash.isstring'
import last from 'lodash.last'
import isEmpty from 'lodash.isempty'
import noop from 'lodash.noop'

export default (file, { _id = uuidv4(), encoding = '', file_name = true, authorizer, metadata, path, acl, bucket, region, expiration, upload_event = noop}) => {
  // Check required vars
  const cache_control = metadata.CacheControl || 'no-cache'
  const expires = metadata.Expires || '0'

  if (!authorizer) {
    throw new Error('authorizer is required')
  }

  // Identify file
  if ((encoding === 'base64') && isString(file)) {
    file = b64toBlob(file)
  }

  // Identify file name
  switch (typeof file_name) {
    case 'boolean':
      let extension = last(file.name != null ? file.name.split('.') : undefined)
      if (!extension) {
        extension = file.type.split('/')[1] // a library of extensions based on MIME types would be better
      }

      file_name = `${uuidv4()}.${extension}`
      break

    case 'function':
      file_name = file_name(file)
      break
  }

  if (isEmpty(file_name)) {
    file_name = file.name
  }

  const file_data = {
    _id,
    file: {
      name:file_name,
      type:file.type,
      size:file.size,
      original_name:file.name,
      cache_control,
      expires
    },
    loaded:0,
    total:file.size,
    percent_uploaded:0,
    status:'authorizing'
  }

  upload_event(null, file_data)

  return authorizer({
      path,
      acl,
      bucket,
      region,
      expiration,
      file_name,
      file_type:file.type,
      file_size:file.size
    },
    function(error,signature) {
      if (error) {
        throw error
      }

      // Prepare data
      const form_data = new FormData()
      form_data.append('key', signature.key)
      form_data.append('acl', signature.acl)
      form_data.append('Content-Type',signature.file_type)

      form_data.append('X-Amz-Date', signature.meta_date)
      // form_data.append 'x-amz-server-side-encryption', 'AES256'
      form_data.append('x-amz-meta-uuid', signature.meta_uuid)
      form_data.append('X-Amz-Algorithm', 'AWS4-HMAC-SHA256')
      form_data.append('X-Amz-Credential', signature.meta_credential)
      form_data.append('X-Amz-Signature',signature.signature)
      form_data.append('Cache-Control', cache_control)
      form_data.append('Expires', expires)
      form_data.append('Policy',signature.policy)

      form_data.append('file',file)

      // Send data
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', event => {
        Session.set('glimpseUp', Math.floor(event.loaded / event.total * 100))
        return upload_event(null, Object.assign(file_data, {
          loaded:event.loaded,
          total:event.total,
          percent_uploaded: Math.floor(((event.loaded / event.total) * 100)),
          status:'uploading'
        }))
      }, false)

      xhr.addEventListener('load', function() {
        if (xhr.status < 400) {
          delete Session.keys.glimpseUp
          return upload_event(null, Object.assign(file_data, {
            percent_uploaded: 100,
            url:signature.url,
            secure_url:signature.secure_url,
            relative_url:signature.relative_url,
            status:'complete'
          }))
        } else {
          return upload_event(new Error('Upload Failed Request Failed'), Object.assign(file_data, { status:'error' }))
        }
      })

      xhr.addEventListener('error', () => upload_event(new Error('Upload Failed Network Error'), Object.assign(file_data, { status:'error' })))

      xhr.addEventListener('abort', () => upload_event(new Error('Upload Failed User Aborted'), Object.assign(file_data, { status:'abort' })))

      xhr.open('POST', signature.post_url,true)

      return xhr.send(form_data)
    })
}
