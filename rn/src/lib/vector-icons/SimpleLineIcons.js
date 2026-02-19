import {getWrappedIconFamily} from './runtime'

const IconFamily = getWrappedIconFamily('SimpleLineIcons')

if (IconFamily === null) {
  throw new Error('[vector-icons] Unsupported icon family: SimpleLineIcons')
}

export default IconFamily
