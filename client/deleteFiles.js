import noop from 'lodash.noop'

export default ({ authorizer, paths = [], deleteComplete = noop }) => {
  // Check required vars
  if (!authorizer) {
    throw new Error('authorizer is required')
  }

  return authorizer({ paths }, deleteComplete)
}
