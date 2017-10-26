/* eslint-disable camelcase */

import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import './main.html'
import { upload_file, delete_files } from 's3up-metadata/client'

var progress = new ReactiveVar(0)

Template.info.helpers({
  'progress': function () {
    return progress.get()
  }
})

Template.info.events({
  'click .upload': function (event, instance) {
    const metadata = {CacheControl: 'max-age=8460000', Expires: 'Thu, 15 Dec 2050 04:08:00 GMT'}
    upload_file(instance.$('input.file_bag')[0].files, {
      authorizer: Meteor.call.bind(this, 'authorize_upload', metadata),
      path: 'your_path-in_s3',
      type: 'image/jpeg',
      metadata,
      upload_event: function (err, res) {
        console.log({err, ...res})
        console.log(res.total_percent_uploaded)
        if (err) throw err

        progress.set(res.total_percent_uploaded)
      }
      // encoding: 'base64',
    })
  },
  'click .delete': function (event, instance) {
    delete_files({
      authorizer: Meteor.call.bind(this, 'authorize_delete'),
      paths: ['noExists.jpg'],
      deleteComplete: function (err, res) {
        console.log({err, res})
      }
    })
  }
})
