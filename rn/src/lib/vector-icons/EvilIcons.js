import {getWrappedIconFamily} from './runtime'

const IconFamily = getWrappedIconFamily('EvilIcons')

if (IconFamily === null) {
  throw new Error('[vector-icons] Unsupported icon family: EvilIcons')
}

export default IconFamily
