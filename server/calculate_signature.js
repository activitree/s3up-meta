import Crypto, { HmacSHA256 } from 'crypto-js'
import dayjs  from 'dayjs'

export default ({ policy, region, secret }) => {
  const kDate = HmacSHA256(dayjs().format("YYYYMMDD"), `AWS4${secret}`)
  const kRegion = HmacSHA256(region, kDate)
  const kService = HmacSHA256("s3", kRegion)
  const signature_key = HmacSHA256("aws4_request", kService)

  return HmacSHA256(policy, signature_key)
    .toString(Crypto.enc.Hex)
}
