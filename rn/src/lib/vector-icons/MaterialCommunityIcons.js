import {getWrappedIconFamily} from './runtime'

const IconFamily = getWrappedIconFamily('MaterialCommunityIcons')

if (IconFamily === null) {
  throw new Error('[vector-icons] Unsupported icon family: MaterialCommunityIcons')
}

export default IconFamily
