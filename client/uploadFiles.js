import upload_file from './uploadFile'
import findIndex from 'lodash.findindex'
import reduce from 'lodash.reduce'
import every from 'lodash.every'

export default (files, ops) => {
  const number_of_files = files.length
  const { upload_event } = ops
  let total_percent_uploaded = 0
  let completed = false

  const files_data = []

  return files.map(file => {
    const fileImage = file.image
    const fileSize = file.size
    upload_file(fileImage, Object.assign(ops, {
      upload_event(err, res) {
        if (err) {
          if (typeof upload_event === 'function') {
            upload_event(err, Object.assign(res, { total_percent_uploaded }))
          }
          total_percent_uploaded = 0
          return
        }

        if (res.status === "authorizing") {
          res.size = file.size
          files_data.push(res)
        }

        if (res.status === "uploading") {
          const file_index = findIndex(files_data, { _id: res._id })
          Object.assign(files[file_index], res)

          const upload_size = reduce(files_data, (total, file) => total + file.total, 0)

          total_percent_uploaded = reduce(files_data, (total, file) => total + Math.floor((file.loaded / file.total) * (file.total / upload_size) * 100), 0)
        }

        const all_files_complete = every(files_data, { status: "complete" })

        if (all_files_complete) {
          total_percent_uploaded = 100
          completed = true
        }

        return (typeof upload_event === 'function' ? upload_event(null, { ...res, total_percent_uploaded: total_percent_uploaded, completed: completed }) : undefined)
      }
    }))
  })
}
