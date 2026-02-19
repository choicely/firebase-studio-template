import {getWrappedIconFamily} from './runtime'

const IconFamily = getWrappedIconFamily('FontAwesome')

if (IconFamily === null) {
  throw new Error('[vector-icons] Unsupported icon family: FontAwesome')
}

export default IconFamily
