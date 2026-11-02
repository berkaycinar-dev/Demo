// Mola yerindeki eşyanın avatarlar için kullanım noktaları: oturma, yatma, binme ya da durma.
// defs: eşyanın yerel çerçevesinde [x, y, z, yaw, kind] listesi (ya da item alan bir fonksiyon);
// yaw yerel +z'ye göre, kind: 'sit' | 'lie' | 'mount' | 'stand'. extra her noktaya eklenir.
export function stations(defs, f, item, extra) {
  const list = typeof defs === 'function' ? defs(item) : defs
  return list?.map(([x, y, z, yaw = 0, kind = 'sit']) => ({ position: f.point(x, y, z).toArray(), yaw: f.facing() + yaw, kind, ...extra }))
}
