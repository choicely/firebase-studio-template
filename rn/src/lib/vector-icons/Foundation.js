import {getWrappedIconFamily} from './runtime'

const IconFamily = getWrappedIconFamily('Foundation')

if (IconFamily === null) {
  throw new Error('[vector-icons] Unsupported icon family: Foundation')
}

export default IconFamily
