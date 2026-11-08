import { getConsoleFunction, setConsoleFunction } from 'three'

// @react-three/fiber 9.x (son kararlı sürüm 9.8.2) her <Canvas> deposunda `new THREE.Clock()` kurar.
// three r183 Clock'u kullanımdan kaldırdı (yerine Timer) ve kurucuda bir uyarı basıyor; uyarı bizim
// kodumuzdan değil, R3F'in içinden gelir. Clock r186'da hâlâ tam çalışır ve state.clock.elapsedTime
// doğru akar, bu yüzden yalnızca bu tek uyarıyı susturuyoruz; diğer three iletileri olduğu gibi geçer.
// R3F Timer'a geçen sürüme (v10) yükselince bu dosya ve içe aktarmaları silinmeli.
const CLOCK_DEPRECATION = 'THREE.Clock: This module has been deprecated'

const previous = getConsoleFunction()

setConsoleFunction((type, message, ...params) => {
  if (type === 'warn' && typeof message === 'string' && message.startsWith(CLOCK_DEPRECATION)) return
  if (previous) return previous(type, message, ...params)
  const trace = params[0]
  if (trace && trace.isStackTrace) console[type](trace.getError(message))
  else console[type](message, ...params)
})
