import {getWrappedIconFamily} from './runtime'

const IconFamily = getWrappedIconFamily('Feather')

if (IconFamily === null) {
  throw new Error('[vector-icons] Unsupported icon family: Feather')
}

export default IconFamily
