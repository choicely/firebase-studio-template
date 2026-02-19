import {getWrappedIconFamily} from './runtime'

const IconFamily = getWrappedIconFamily('AntDesign')

if (IconFamily === null) {
  throw new Error('[vector-icons] Unsupported icon family: AntDesign')
}

export default IconFamily
