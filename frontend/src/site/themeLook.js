// Oda kartlarındaki küçük renk şeritleri: 3D sahne açmadan temanın havasını verir.
export const THEME_SWATCH = {
  library: 'linear-gradient(135deg, #6B4A33, #2B3040)',
  cabin: 'linear-gradient(135deg, #B8733F, #5A3A2A 60%, #DCE6EE)',
  office: 'linear-gradient(135deg, #2A3448, #1F4A40)',
  teagarden: 'linear-gradient(135deg, #C8743A, #2F6E8E)',
  camp: 'linear-gradient(135deg, #E08A3C, #24402F 55%, #1C2B3A)',
  space: 'linear-gradient(135deg, #1B1F3A, #4B3A8C 60%, #8FB5DA)',
  underwater: 'linear-gradient(135deg, #0F4C5C, #1F8A9E 60%, #9AD9CE)',
  bar: 'linear-gradient(135deg, #3A1E2E, #B5482F 60%, #E8A866)',
  treehouse: 'linear-gradient(135deg, #5B8F4A, #6B4A33 60%, #F2C76B)',
  cyber: 'linear-gradient(135deg, #12141A, #6A3AB8 55%, #3CD2C2)',
  alchemist: 'linear-gradient(135deg, #3A2E4A, #6B4A33 60%, #9FE9DC)',
}

export const swatchOf = (theme) => THEME_SWATCH[theme] ?? 'var(--surface-2)'

