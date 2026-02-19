import {getWrappedIconFamily} from './runtime'

const IconFamily = getWrappedIconFamily('Zocial')

if (IconFamily === null) {
  throw new Error('[vector-icons] Unsupported icon family: Zocial')
}

export default IconFamily
