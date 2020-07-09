export default (b64Data, contentType, sliceSize) => {
  const data = b64Data.split("base64,")
  if (!contentType) {
    contentType = data[0].replace("data:","").replace(";","")
  }

  sliceSize = sliceSize || 512

  const byteCharacters = atob(data[1])
  const byteArrays = []

  for (let offset = 0, end = byteCharacters.length, step = sliceSize, asc = step > 0; asc ? offset < end : offset > end; offset += step) {
    const slice = byteCharacters.slice(offset, offset + sliceSize)
    const byteNumbers = new Array(slice.length)

    for (let i = 0, end1 = slice.length, asc1 = 0 <= end1; asc1 ? i < end1 : i > end1; asc1 ? i++ : i--) {
      byteNumbers[i] = slice.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)

    byteArrays.push(byteArray)
  }
  return new Blob(byteArrays, {type: contentType})
}
