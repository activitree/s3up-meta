# S3 Uploads

<a href="https://www.repostatus.org/#active"><img src="https://www.repostatus.org/badges/latest/active.svg" alt="Project Status: Active – The project has reached a stable, usable state and is being actively developed." /></a>

### NOTES
This is a rewrite of a package by Lepozepo where metadata {Cache_Control: ...., Expires: ....} has been added in order to control caching of S3 files.

## Installation

``` sh
$ npm i --save s3up-meta@git+https://github.com/paulincai/s3up-meta.git
```

## How to use

### Step 1
Add your AWS configuration to your settings:

In your settings.json :

```
{
  "private": {
    "s3": {
      "key": "xxxxxx",
      "secret": "xxxxxxxxxxxxxx",
      "bucket": "xxxxxxxxxxxxxx",
      "region": "eu-central-1"
    }
  }
}

```

### Step 2
Set up your authorizers functions. This could be in your startup/server. **SERVER SIDE**

```
import { Meteor } from 'meteor/meteor'
import { authorizer as Authorizer } from 's3up-meta/server'

/**
 * S3 image upload and delete methods. Although they are server side, the file upload is
 * directly from client to S3
 */

const services = Meteor.settings.private.s3
const authorizer = new Authorizer(services)

Meteor.methods({
  authorizeUpload: function (ops, metadata) {
    this.unblock()
    return authorizer.authorizeUpload(metadata, ops)
  },
  authorize_delete: function (ops) {
    this.unblock()
    return authorizer.authorize_delete(ops)
  }
})

```

### Step 3
Sign the upload. Receive the signature from Meteor server and use it to upload from client directly to S3. **CLIENT SIDE**
Example as a Redux action, please extrapolate to a method of your convenience.

Concept: before start of upload trigger the showing of a spinner. If, for instance, you replace an avatar image, call the upload of a new image and on success, call delete of the old avatar.

``` javascript
import { Meteor } from 'meteor/meteor'
import { deleteFiles, uploadFile } from 's3up-meta/client'
import b64toBlob from '../../helpers/b64toBlob' // I use my own blob library

export const UPLOAD_IMAGE_AWS = 'UPLOAD_IMAGE_AWS' // this should return a image URL as payload
export const DELETE_IMAGE_AWS = 'DELETE_IMAGE_AWS'
export const SET_STATE_UPLOADER = 'SET_STATE_UPLOADER'

const setStateUploader = states => {
  return {
    type: SET_STATE_UPLOADER,
    payload: states
  }
}

const uploadImageAWS = (imageData, path, size) => {
  if (!imageData || !path) {
    return {
      type: UPLOAD_IMAGE_AWS,
      payload: null
    }
  }
  return dispatch => {
    dispatch(setStateUploader({ showUploadSpinner: true })) // from the action above
    let blobData = imageData.slice(23)
    const metadata = { CacheControl: 'max-age=8460000', Expires: 'Thu, 15 Dec 2050 04:08:00 GMT' } // this is a veeeeery long time
    blobData = b64toBlob(blobData, 'image/jpeg')
    path = path === 'post' ? 'postsProxy' : 'avatar' // just some conditions to send the file in S3 to one folder or another
    uploadFile(blobData, {
      authorizer: Meteor.call.bind(this, 'authorizeUpload', metadata), // authorization so I can write in S3
      path, // to where I write in my bucket in S3
      type: 'image/jpeg', // or something else...PNG, PDF etc
      metadata, // see this constant above
      upload_event: (err, res) => {
        if (err) {
          dispatch({
            type: SET_STATE_UPLOADER,
            payload: null
          })
        } else {
          if (res.relative_url) {
	  // the rest below is irelevant, it can be whatever you need it to be. Just make use of res.relative_url...	
            
	    let image = null
            if (path === 'avatar' || path === 'covers') { image = res.relative_url.substring(8) } else if (path === 'postsProxy') { image = res.relative_url.substring(12) }
            const payload = path === 'postsProxy' ? { postImage: image, size } : path === 'covers' ? { coverImage: image, size } : { avatarImage: image, size }
            dispatch({
              type: UPLOAD_IMAGE_AWS,
              payload
            })
          }
        }
      }
    })
  }
}

const deleteImageAWS = (path, oldImage) => {
  return dispatch => {
    const paths = path === 'avatar' ? [`avatar/${oldImage}`, `avatar-h/${oldImage}`] : [`${path}/${oldImage}`] // I delete 2 avatar sizes.
    if (oldImage) {
      deleteFiles({
        authorizer: Meteor.call.bind(this, 'authorize_delete'),
        paths,
        deleteComplete: (err, res) => {
          dispatch({
            type: DELETE_IMAGE_AWS,
            payload: err ? { err } : 'OK'
          })
        }
      })
    }
  }
}

```

Notice how `upload_files` require an `authorizer` function to communicate with the server. In Meteor this is a `Meteor.method` but you can use anything.
deleteFiles takes place server side. File keys (S3 paths) are being sent to the Meteor server for deletion. Does not require authorisation since this doesn't require the slingshot principle (uploading from client directly to S3)

## Create your Amazon S3

For all of this to work you need to create an aws account.

### 1. Create an S3 bucket in your preferred region.

### 2. Access Key Id and Secret Key

1. Navigate to your bucket
2. On the top right side you'll see your account name. Click it and go to Security Credentials.
3. Create a new access key under the Access Keys (Access Key ID and Secret Access Key) tab.
4. Enter this information into your app as defined in "How to Use" "Step 1".
5. Your region can be found under "Properties" button and "Static Website Hosting" tab.
	* bucketName.s3-website-**eu-west-1**.amazonaws.com.
	* If your region is "us-east-1" or "us-standard" then you don't need to specify this in the config.

### 3. Hosting

1. Upload a blank `index.html` file (anywhere is ok, I put it in root).
2. Select the bucket's properties by clicking on the bucket (from All Buckets) then the "Properties" button at the top right.
3. Click **"Static Website Hosting"** tab.
4. Click **Enable Website Hosting**.
5. Fill the `Index Document` input with the path to your `index.html` without a trailing slash. E.g. `afolder/index.html`, `index.html`
6. **Click "Save"**

### 4. CORS

You need to set permissions so that everyone can see what's in there.

1. Select the bucket's properties and go to the "Permissions" tab.
2. Click "Edit CORS Configuration" and paste this:

	``` xml
	<?xml version="1.0" encoding="UTF-8"?>
	<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
		<CORSRule>
			<AllowedOrigin>*</AllowedOrigin>
			<AllowedMethod>PUT</AllowedMethod>
			<AllowedMethod>POST</AllowedMethod>
			<AllowedMethod>GET</AllowedMethod>
			<AllowedMethod>HEAD</AllowedMethod>
			<MaxAgeSeconds>3000</MaxAgeSeconds>
			<AllowedHeader>*</AllowedHeader>
		</CORSRule>
	</CORSConfiguration>
	```

5. Click "Edit bucket policy" and paste this (**Replace the bucket name with your own**):

	``` javascript
	{
		"Version": "2008-10-17",
		"Statement": [
			{
				"Sid": "AllowPublicRead",
				"Effect": "Allow",
				"Principal": {
					"AWS": "*"
				},
				"Action": "s3:GetObject",
				"Resource": "arn:aws:s3:::YOURBUCKETNAMEHERE/*"
			}
		]
	}
	```

7. **Click Save**

### Note

It might take a couple of hours before you can actually start uploading to S3. Amazon takes some time to make things work.

Enjoy, this took me a long time to figure out and I'm sharing it so that nobody has to go through all that.

## API
[TODO]

#### Developer Notes
http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/frames.html
https://github.com/Differential/meteor-uploader/blob/master/lib/UploaderFile.coffee#L169-L178

http://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-auth-using-authorization-header.html
http://docs.aws.amazon.com/general/latest/gr/sigv4-signed-request-examples.html
https://github.com/CulturalMe/meteor-slingshot/blob/master/services/aws-s3.js

