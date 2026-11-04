// Ortam sesleri: ses dosyası yok, hepsi Web Audio ile gerçek zamanlı üretilir (gürültü + filtreler +
// rastgele olaylar). Aynı anda tek ses çalar; ses düzeyi ana kazançtan ayarlanır.

export const SOUNDS = [
  { id: 'rain', label: 'Yağmur' },
  { id: 'fire', label: 'Şömine' },
  { id: 'cafe', label: 'Kafe' },
  { id: 'forest', label: 'Orman' },
  { id: 'waves', label: 'Deniz' },
]

let ctx = null
let master = null
let current = null
// Oluşturulan sürekli kaynaklar (gürültü döngüleri, LFO'lar); ses kapanınca durdurulur.
let live = []
const buffers = {}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  // Tarayıcı ilk kullanıcı etkileşimine kadar sesi askıya alabilir; ilk tıklamada sürdür.
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
    const wake = () => ctx.resume().catch(() => {})
    window.addEventListener('pointerdown', wake, { once: true })
  }
  return ctx
}

// 4 sn'lik döngüsel gürültü: white (cızırtı), pink (yağmur, uğultu), brown (gürleme, dalga).
function noise(c, type) {
  if (buffers[type]) return buffers[type]
  const len = c.sampleRate * 4
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    if (type === 'white') d[i] = w * 0.5
    else if (type === 'brown') {
      last = (last + 0.02 * w) / 1.02
      d[i] = last * 3.5
    } else {
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.969 * b2 + w * 0.153852
      b3 = 0.8665 * b3 + w * 0.3104856
      b4 = 0.55 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.016898
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    }
  }
  buffers[type] = buf
  return buf
}

// Küçük yardımcılar: her ses kendi düğümlerini bir "bus" kazancına bağlar; durdurunca bus söner.
function loop(c, type, out, { lowpass, highpass, bandpass, q = 0.7, gain = 1 } = {}) {
  const src = c.createBufferSource()
  src.buffer = noise(c, type)
  src.loop = true
  src.loopStart = Math.random()
  let node = src
  const chain = (f) => {
    node.connect(f)
    node = f
    return f
  }
  if (highpass) Object.assign(chain(c.createBiquadFilter()), { type: 'highpass' }).frequency.value = highpass
  if (lowpass) Object.assign(chain(c.createBiquadFilter()), { type: 'lowpass' }).frequency.value = lowpass
  let band = null
  if (bandpass) {
    band = chain(c.createBiquadFilter())
    band.type = 'bandpass'
    band.frequency.value = bandpass
    band.Q.value = q
  }
  const g = chain(c.createGain())
  g.gain.value = gain
  g.connect(out)
  src.start(0, Math.random() * 3)
  live.push(src)
  return { src, gain: g, band }
}

// param üzerinde yavaş salınım (LFO): değer = taban ± derinlik.
function lfo(c, param, rate, depth) {
  const osc = c.createOscillator()
  osc.frequency.value = rate
  const amp = c.createGain()
  amp.gain.value = depth
  osc.connect(amp).connect(param)
  osc.start()
  live.push(osc)
  return osc
}

// Kısa gürültü patlaması (çıtırtı, damla).
function burst(c, out, at, { freq, q = 1, dur, level }) {
  const src = c.createBufferSource()
  src.buffer = noise(c, 'white')
  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = freq
  f.Q.value = q
  const g = c.createGain()
  g.gain.setValueAtTime(level, at)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  src.connect(f).connect(g).connect(out)
  src.start(at, Math.random() * 3, dur + 0.05)
}

// Tını (fincan şıngırtısı, kuş): sinüs, isteğe bağlı frekans kayması.
function tone(c, out, at, { freq, to, dur, level, type = 'sine' }) {
  const o = c.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(freq, at)
  if (to) o.frequency.exponentialRampToValueAtTime(to, at + dur * 0.8)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(level, at + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  o.connect(g).connect(out)
  o.start(at)
  o.stop(at + dur + 0.05)
}

// Rastgele aralıklarla olay planlar; durdurulana kadar sürer.
function every(minMs, maxMs, fn, timers) {
  const next = () => {
    timers.push(setTimeout(() => {
      fn()
      next()
    }, minMs + Math.random() * (maxMs - minMs)))
  }
  next()
}

const BUILDERS = {
  rain(c, out, t) {
    loop(c, 'pink', out, { highpass: 400, lowpass: 7000, gain: 0.9 })
    loop(c, 'brown', out, { lowpass: 300, gain: 0.35 })
    every(20, 90, () => burst(c, out, c.currentTime, { freq: 2500 + Math.random() * 4000, q: 2, dur: 0.02 + Math.random() * 0.03, level: 0.05 + Math.random() * 0.12 }), t)
  },
  fire(c, out, t) {
    const base = loop(c, 'brown', out, { lowpass: 450, gain: 0.8 })
    lfo(c, base.gain.gain, 0.3, 0.2)
    loop(c, 'pink', out, { bandpass: 900, q: 0.6, gain: 0.08 })
    every(40, 260, () => {
      const n = 1 + Math.floor(Math.random() * 3)
      for (let i = 0; i < n; i++) {
        burst(c, out, c.currentTime + i * (0.01 + Math.random() * 0.04), { freq: 1500 + Math.random() * 4000, q: 1.2, dur: 0.008 + Math.random() * 0.03, level: 0.15 + Math.random() * 0.5 })
      }
    }, t)
  },
  cafe(c, out, t) {
    // konuşma uğultusu: konuşma bandında gürültü, birkaç yavaş salınımla
    const a = loop(c, 'pink', out, { bandpass: 500, q: 0.9, gain: 0.55 })
    const b = loop(c, 'pink', out, { bandpass: 1100, q: 1.2, gain: 0.25 })
    lfo(c, a.gain.gain, 0.23, 0.2)
    lfo(c, b.gain.gain, 0.37, 0.12)
    lfo(c, a.band.frequency, 0.11, 120)
    loop(c, 'brown', out, { lowpass: 200, gain: 0.25 })
    every(1800, 6000, () => {
      const f = 2200 + Math.random() * 1800
      tone(c, out, c.currentTime, { freq: f, dur: 0.6, level: 0.035 })
      tone(c, out, c.currentTime, { freq: f * 1.52, dur: 0.4, level: 0.02 })
    }, t)
  },
  forest(c, out, t) {
    const wind = loop(c, 'pink', out, { bandpass: 600, q: 0.5, gain: 0.4 })
    lfo(c, wind.band.frequency, 0.07, 300)
    lfo(c, wind.gain.gain, 0.05, 0.15)
    loop(c, 'white', out, { highpass: 3000, lowpass: 9000, gain: 0.03 })
    every(1500, 6000, () => {
      const base = 2400 + Math.random() * 1800
      const n = 2 + Math.floor(Math.random() * 4)
      for (let i = 0; i < n; i++) {
        tone(c, out, c.currentTime + i * 0.14, { freq: base, to: base * (1.2 + Math.random() * 0.4), dur: 0.09, level: 0.04 + Math.random() * 0.03 })
      }
    }, t)
  },
  waves(c, out) {
    const sea = loop(c, 'brown', out, { lowpass: 700, gain: 0.55 })
    lfo(c, sea.gain.gain, 0.085, 0.4)
    const foam = loop(c, 'pink', out, { highpass: 900, lowpass: 5000, gain: 0.12 })
    lfo(c, foam.gain.gain, 0.085, 0.1)
  },
}

/** Sesi başlatır (çalan varsa önce onu durdurur). volume: 0-1 */
export function playAmbient(id, volume = 0.5) {
  stopAmbient()
  const c = audio()
  if (!c || !BUILDERS[id]) return
  setAmbientVolume(volume)
  const bus = c.createGain()
  bus.gain.setValueAtTime(0.0001, c.currentTime)
  bus.gain.exponentialRampToValueAtTime(1, c.currentTime + 1.2)
  bus.connect(master)
  const timers = []
  live = []
  BUILDERS[id](c, bus, timers)
  current = { bus, timers, nodes: live }
  live = []
}

export function setAmbientVolume(volume) {
  if (!ctx) return
  // kulak logaritmik duyar: kaydırıcının ortası gerçekten "orta" duyulsun
  const v = Math.max(0, Math.min(1, volume))
  master.gain.setTargetAtTime(v * v, ctx.currentTime, 0.05)
}

export function stopAmbient() {
  if (!current || !ctx) return
  const { bus, timers, nodes } = current
  current = null
  timers.forEach(clearTimeout)
  bus.gain.cancelScheduledValues(ctx.currentTime)
  bus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2)
  setTimeout(() => {
    nodes.forEach((n) => n.stop())
    bus.disconnect()
  }, 1200)
}

/** Pomodoro aşaması bitince kısa zil. */
export function chime() {
  const c = audio()
  if (!c) return
  const out = c.createGain()
  out.gain.value = 0.25
  out.connect(c.destination)
  ;[880, 1320].forEach((f, i) => tone(c, out, c.currentTime + i * 0.18, { freq: f, dur: 0.9, level: 0.5 }))
  setTimeout(() => out.disconnect(), 2000)
}
