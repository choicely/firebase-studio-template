import {getWrappedIconFamily} from './runtime'

const IconFamily = getWrappedIconFamily('FontAwesome5')

if (IconFamily === null) {
  throw new Error('[vector-icons] Unsupported icon family: FontAwesome5')
}

export default IconFamily
