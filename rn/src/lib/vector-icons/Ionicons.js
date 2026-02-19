import {getWrappedIconFamily} from './runtime'

const IconFamily = getWrappedIconFamily('Ionicons')

if (IconFamily === null) {
  throw new Error('[vector-icons] Unsupported icon family: Ionicons')
}

export default IconFamily
