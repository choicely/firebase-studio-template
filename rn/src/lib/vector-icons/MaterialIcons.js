import {getWrappedIconFamily} from './runtime'

const IconFamily = getWrappedIconFamily('MaterialIcons')

if (IconFamily === null) {
  throw new Error('[vector-icons] Unsupported icon family: MaterialIcons')
}

export default IconFamily
