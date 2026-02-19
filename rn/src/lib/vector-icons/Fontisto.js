import {getWrappedIconFamily} from './runtime'

const IconFamily = getWrappedIconFamily('Fontisto')

if (IconFamily === null) {
  throw new Error('[vector-icons] Unsupported icon family: Fontisto')
}

export default IconFamily
