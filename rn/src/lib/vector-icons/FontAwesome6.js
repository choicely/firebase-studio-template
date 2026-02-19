import {getWrappedIconFamily} from './runtime'

const IconFamily = getWrappedIconFamily('FontAwesome6')

if (IconFamily === null) {
  throw new Error('[vector-icons] Unsupported icon family: FontAwesome6')
}

export default IconFamily
