import { createHmac } from 'crypto'
import dayjs from 'dayjs'

export default ({ policy, region, secret }) => {
  const kDate = createHmac('sha256', `AWS4${secret}`).update(dayjs().format("YYYYMMDD")).digest()
  const kRegion = createHmac('sha256', kDate).update(region).digest()
  const kService = createHmac('sha256', kRegion).update("s3").digest()
  const signature_key = createHmac('sha256', kService).update("aws4_request").digest()

  return createHmac('sha256', signature_key).update(policy).digest('hex')
}
