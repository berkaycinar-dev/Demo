// Odaya ve yere göre davranış: çalışırken ne yapılır, uzaktayken nasıl uyunur, mola yerinde ne
// yapılır. AvatarCrowd koltukları ve mola yerlerini bu tablolarla eşler.

// Temaların genel tarzı. held: masasız koltukta elde tutulan (kitap | tablet), tool: yazı aracı,
// away: uyuma biçimi ('desk' masaya kapanır, 'lean' arkaya yaslanır, 'newspaper' yüzünde gazete,
// 'tent' çadıra girip uyur).
export const THEME_STYLES = {
  library: { held: 'book', tool: 'pen', away: 'desk' },
  cabin: { held: 'book', tool: 'pen', away: 'desk' },
  office: { held: 'tablet', tool: 'pen', away: 'lean' },
  teagarden: { held: 'book', tool: 'pen', away: 'newspaper' },
  camp: { held: 'book', tool: 'pen', away: 'tent' },
  space: { held: 'tablet', tool: 'pen', away: 'lean' },
  underwater: { held: 'tablet', tool: 'pen', away: 'lean' },
  bar: { held: 'book', tool: 'pen', away: 'desk' },
  treehouse: { held: 'book', tool: 'pen', away: 'desk' },
  cyber: { held: 'tablet', tool: 'pen', away: 'lean' },
  alchemist: { held: 'book', tool: 'quill', away: 'desk' },
}
const DEFAULT_STYLE = { held: 'book', tool: 'pen', away: 'desk' }

// Mola yerleri (kimlik, -2 gibi ekler olmadan). stand: ayakta yapılan hareket (poses.STAND_POSES),
// prop: elde tutulan; sit: yerde oturma / yatma / binme noktası varsa oradaki hareket. near: duruş
// yeri eşyaya doğru yaklaştırılır (kullanılan eşyalar). face: 'open' manzaraya (zeminin bittiği
// yöne: göl, deniz) döner.
export const SPOT_ACTIVITIES = {
  window: { stand: 'view' },
  sea: { stand: 'view', face: 'open' },
  lake: { stand: 'skip', face: 'open' },
  dock: { stand: 'fish', face: 'open' },
  cupola: { stand: 'kneelLook' },
  moonpool: { stand: 'kneelLook', near: true },
  tea: { stand: 'sip', prop: 'mug' },
  cocoa: { stand: 'sip', prop: 'mug' },
  coffee: { stand: 'sip', prop: 'mug' },
  galley: { stand: 'sip', prop: 'mug' },
  water: { stand: 'sip', prop: 'paperCup' },
  counter: { stand: 'sip', prop: 'teaGlass' },
  simit: { stand: 'eat', prop: 'simit' },
  vending: { stand: 'eat', prop: 'ramen' },
  fountain: { stand: 'drink', near: true },
  reading: { stand: 'read', sit: { pose: 'lounge', prop: 'book' } },
  sofa: { stand: 'look', sit: { pose: 'lounge', prop: 'mug' } },
  lounge: { stand: 'look', sit: { pose: 'lounge', prop: 'phone' } },
  sedir: { stand: 'sip', prop: 'teaGlass', sit: { pose: 'lounge', prop: 'teaGlass' } },
  tree: { stand: 'view', sit: { pose: 'lounge', prop: 'teaGlass' } },
  bench: { stand: 'view', sit: { pose: 'lounge' } },
  picnic: { stand: 'sip', prop: 'mug', sit: { pose: 'lounge', prop: 'mug' } },
  hammock: { stand: 'view', sit: { pose: 'lie' } },
  treadmill: { stand: 'stretch', sit: { pose: 'run' } },
  vr: { stand: 'look', sit: { pose: 'vr' } },
  catalog: { stand: 'browse', near: true },
  vitrine: { stand: 'lookDown', near: true },
  fireplace: { stand: 'warm', near: true, sit: { pose: 'lounge', prop: 'mug' } },
  board: { stand: 'board', near: true },
  console: { stand: 'panel', near: true },
  sonar: { stand: 'panel', near: true },
  datawall: { stand: 'wall', near: true },
  garden: { stand: 'water', near: true },
  kelp: { stand: 'water', near: true },
  jellies: { stand: 'glass', near: true },
  jukebox: { stand: 'dance' },
  darts: { stand: 'darts' },
  pool: { stand: 'pool', near: true },
  pingpong: { stand: 'pingpong' },
  telescope: { stand: 'telescope', near: true },
  cauldron: { stand: 'stir', near: true },
  crystal: { stand: 'crystal', near: true },
  tent: { stand: 'crouch', near: true },
  hightable: { stand: 'sip', prop: 'mug' },
  shelf: { stand: 'browse', near: true },
  servers: { stand: 'panel', near: true },
}

// Temaya özel farklar.
const THEME_SPOTS = {
  library: { window: { stand: 'view', sit: { pose: 'lounge', prop: 'book' } } },
  cabin: { window: { stand: 'view', sit: { pose: 'lounge', prop: 'mug' } } },
  treehouse: { bench: { stand: 'view', sit: { pose: 'lounge', prop: 'mug' } } },
  alchemist: { bench: { stand: 'potion', near: true } },
  underwater: { window: { stand: 'glass' } },
  space: { galley: { stand: 'sip', prop: 'paperCup' } },
}

// Hareketin kendisinin gerektirdiği eşyalar.
const POSE_PROPS = {
  read: ['book'],
  phone: ['phone'],
  darts: ['dart'],
  pool: ['cue'],
  pingpong: ['paddle'],
  stir: ['ladle'],
  potion: ['flask'],
  vr: ['vr'],
  water: ['watering'],
  fish: ['rod'],
  skip: ['stone'],
}

export const baseSpotId = (id) => id.replace(/-\d+$/, '')

export function spotActivity(theme, spotId) {
  const id = baseSpotId(spotId)
  return THEME_SPOTS[theme]?.[id] ?? SPOT_ACTIVITIES[id] ?? { stand: 'look' }
}

export const styleOf = (theme) => THEME_STYLES[theme] ?? DEFAULT_STYLE

/**
 * Koltuğa göre davranış. seat: { position, yaw, desk?, kind? } (desk: masadaki eşya), rise: önündeki
 * masanın oturaktan yüksekliği (yoksa null). Dönüş: { sit, focus: [hareket, hareket], away }.
 * focus iki hareket arasında ~30 sn'de bir geçilir.
 */
export function seatBehavior(theme, seat, rise) {
  const style = styleOf(theme)
  const y = seat.position[1]
  const desk = rise != null && rise >= 0.13
  const sit = { y, low: y < 0.35, slope: !desk && ['log', 'stump', 'armchair', 'bench'].includes(seat.kind), rise: desk ? rise : null }
  const item = desk ? seat.desk ?? null : null
  let focus
  if (!desk) focus = [style.held === 'tablet' ? 'tablet' : 'read', 'think']
  else if (item === 'keyboard' || item === 'laptop') focus = ['type', 'type']
  else if (item === 'screen') focus = ['tap', 'tap']
  else if (item === 'book') focus = ['deskRead', 'write']
  else if (item === 'notebook') focus = ['write', 'think']
  else if (item === 'tea') focus = ['read', 'think']
  else focus = style.held === 'tablet' ? ['tap', 'tap'] : ['write', 'read']

  let away
  if (style.away === 'tent') away = 'tent'
  else if (style.away === 'newspaper') away = 'newspaper'
  // koltukta göğüste açık kitapla uyur; tabletli temalarda (siber lounge) yalnızca arkaya yaslanır
  else if (!desk) away = seat.kind === 'armchair' && style.held === 'book' ? 'bookChest' : 'lean'
  else if (item === 'keyboard' || item === 'screen') away = style.away === 'desk' ? 'desk' : 'lean'
  else away = sit.low || style.away === 'desk' ? 'desk' : style.away
  return { sit, focus, away, tool: style.tool, held: style.held }
}

/** Odada kullanılacak eşyalar: avatar parçaları yalnızca bunlar için kurulur. */
export function roomProps(theme, seats, spots) {
  const out = new Set(['book', 'pen', 'mug'])
  const style = styleOf(theme)
  out.add(style.held)
  out.add(style.tool)
  for (const s of seats) {
    if (s.behavior.away === 'newspaper' || s.behavior.away === 'bookChest') out.add(s.behavior.away)
  }
  for (const spot of spots) {
    const act = spot.activity
    if (act.prop) out.add(act.prop)
    for (const p of POSE_PROPS[act.stand] ?? []) out.add(p)
    if (act.sit) {
      if (act.sit.prop) out.add(act.sit.prop)
      for (const p of POSE_PROPS[act.sit.pose] ?? []) out.add(p)
    }
  }
  return out
}
