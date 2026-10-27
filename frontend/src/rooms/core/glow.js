import { CanvasTexture, PlaneGeometry, SRGBColorSpace } from 'three'

// Işık havuzları için yere yatık düzlem ve yumuşak dairesel doku (tüm sahneler paylaşır).
export const FLAT_PLANE = new PlaneGeometry().rotateX(-Math.PI / 2)

let glowTexture
export function getGlowTexture() {
  if (glowTexture) return glowTexture
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.45)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  glowTexture = new CanvasTexture(canvas)
  glowTexture.colorSpace = SRGBColorSpace
  return glowTexture
}
