import {getWrappedIconFamily} from './runtime'

const IconFamily = getWrappedIconFamily('Entypo')

if (IconFamily === null) {
  throw new Error('[vector-icons] Unsupported icon family: Entypo')
}

export default IconFamily
