import {getWrappedIconFamily} from './runtime'

const IconFamily = getWrappedIconFamily('Octicons')

if (IconFamily === null) {
  throw new Error('[vector-icons] Unsupported icon family: Octicons')
}

export default IconFamily
