---
name: Odakhane
description: Kamerasız birlikte odaklanma odası; sıcak ahşap, kâğıt ve kil malzemeli arayüz, voxel odanın etrafında.
colors:
  terracotta: "#9c4122"
  terracotta-hover: "#85361c"
  terracotta-fill: "#a24526"
  terracotta-soft: "#f8e7dd"
  terracotta-ring: "#b5502d"
  on-terracotta: "#fff8f1"
  chip-on-bg: "#f5ddd0"
  chip-on-fg: "#3d1a0c"
  terracotta-dark: "#eb9a78"
  terracotta-ring-dark: "#e08a66"
  chip-on-bg-dark: "#4b2d22"
  page-base: "#efe9df"
  surface: "#fffdf9"
  material-paper: "#f2ece2"
  material-clay: "#ebe2d4"
  line: "#e6ded2"
  line-strong: "#cbbfae"
  line-field: "#958775"
  line-strong-dark: "#786f66"
  line-field-dark: "#857b70"
  text: "#221e1a"
  text-2: "#3d362f"
  muted: "#675e54"
  page-base-dark: "#24211e"
  surface-dark: "#302c28"
  material-wood: "#3b3530"
  material-clay-dark: "#2a2622"
  line-dark: "#47403a"
  text-dark: "#efe9e1"
  muted-dark: "#b3a99c"
  sign-wood: "#5b4331"
  sign-edge: "#3e2d20"
  sign-ink: "#f7eedd"
  success: "#1e6650"
  break: "#245f58"
  info: "#1f93ab"
  badge: "#8a5f08"
  status-focus: "#1f8a4c"
  status-break: "#b86e00"
  status-away: "#7f776e"
  room-library: "#146d34"
  room-library-dark: "#89d298"
  room-cabin: "#735601"
  room-cabin-dark: "#deb866"
  room-office: "#34589d"
  room-office-dark: "#9bbeff"
  room-teagarden: "#006483"
  room-teagarden-dark: "#68ccf5"
  room-camp: "#44670d"
  room-camp-dark: "#a6cc80"
  room-space: "#5b4c99"
  room-space-dark: "#bcb2ff"
  room-underwater: "#016869"
  room-underwater-dark: "#57d4d4"
  room-bar: "#8a3a64"
  room-bar-dark: "#f4a0c8"
  room-treehouse: "#615e00"
  room-treehouse-dark: "#c4c36c"
  room-cyber: "#764286"
  room-cyber-dark: "#dca7ec"
typography:
  pixel-hero:
    fontFamily: "Pixelify Sans, Pixelify Fallback, Inter, system-ui, sans-serif"
    fontSize: "55px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "0"
  pixel-display:
    fontFamily: "Pixelify Sans, Pixelify Fallback, Inter, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "0"
  pixel-headline:
    fontFamily: "Pixelify Sans, Pixelify Fallback, Inter, system-ui, sans-serif"
    fontSize: "33px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "0"
  pixel-label:
    fontFamily: "Pixelify Sans, Pixelify Fallback, Inter, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0"
  title:
    fontFamily: "Inter, Inter Fallback, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title-s:
    fontFamily: "Inter, Inter Fallback, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  lead:
    fontFamily: "Inter, Inter Fallback, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Inter, Inter Fallback, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: "Inter, Inter Fallback, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  meta:
    fontFamily: "Inter, Inter Fallback, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  numeric:
    fontFamily: "Inter, Inter Fallback, system-ui, Segoe UI, Roboto, sans-serif"
    fontWeight: 700
    fontFeature: "'tnum' 1"
  label:
    fontFamily: "Inter, Inter Fallback, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  block: "6px"
  sm: "8px"
  control-sm: "10px"
  control: "12px"
  control-lg: "14px"
  card: "20px"
  card-lg: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "56px"
  page-gutter: "32px"
  page-gutter-narrow: "16px"
  page-max: "1216px"
  measure-text: "720px"
components:
  button-primary:
    backgroundColor: "{colors.terracotta-fill}"
    textColor: "{colors.on-terracotta}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.terracotta-hover}"
  button-primary-disabled:
    backgroundColor: "{colors.material-paper}"
    textColor: "{colors.muted}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "46px"
  button-secondary-hover:
    backgroundColor: "{colors.material-paper}"
  button-small:
    rounded: "{rounded.control-sm}"
    padding: "0 14px"
    height: "36px"
  button-wide:
    rounded: "{rounded.control-lg}"
    width: "100%"
    height: "54px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "24px"
  input:
    backgroundColor: "{colors.page-base}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "46px"
  nav-item:
    textColor: "{colors.muted}"
    rounded: "{rounded.control-sm}"
    padding: "0 14px"
    height: "44px"
  nav-item-active:
    backgroundColor: "{colors.material-paper}"
    textColor: "{colors.text}"
  segmented:
    backgroundColor: "{colors.material-clay}"
    rounded: "9px"
    padding: "3px"
  segmented-option-on:
    backgroundColor: "{colors.chip-on-bg}"
    textColor: "{colors.chip-on-fg}"
    rounded: "{rounded.block}"
    height: "36px"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.card-lg}"
  option-block:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.block}"
    height: "44px"
  choice-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.block}"
    padding: "0 14px"
    height: "40px"
  door-sign:
    backgroundColor: "{colors.sign-wood}"
    textColor: "{colors.sign-ink}"
    typography: "{typography.pixel-headline}"
---

# Design System: Odakhane

<!-- impeccable:design-map -->
Name: Odakhane
Colors: primary: terracotta #9c4122; tertiary: room-library #146d34; neutral: page-base #efe9df; semantic: success #1e6650; primary: terracotta-hover #85361c; primary: terracotta-fill #a24526 (+54 more in the sidecar)
Fonts: Pixelify Sans (pixel-hero, pixel-display, pixel-headline, pixel-label); Inter (title, title-s, lead, body, control, meta, numeric, label)
Spacing: xs 4px, sm 8px, md 12px, lg 16px, xl 24px, 2xl 32px, 3xl 56px, page-gutter 32px, page-gutter-narrow 16px, page-max 1216px, measure-text 720px
Radius: block 6px, sm 8px, control-sm 10px, control 12px, control-lg 14px, card 20px, card-lg 24px, pill 999px
North Star: "Akşam Çalışma Odası"
Rules:
- The One Ember Rule. Terracotta yalnızca birincil eylem, seçim ve odak içindir.
- The Room Identity Rule. Oda vurgusu yalnızca "bu hangi oda" sorusunu yanıtlar ve hep küçük kare
- The Same Warmth Rule. Koyu mod ayrı bir dünya değil, aynı odanın akşamıdır: her nötr kahve
- The Eleven Grid Rule. Pixelify'ın bir pikseli 92/1000 em'dir; yazı yalnızca 11'in katlarında
- The One Pixel Voice Rule. Piksel yazı başlık ve bir değeri okutan kısa yazı içindir; okunan
- The Scale Token Rule. Yazı boyutu `--text-*` ya da `--pixel-*` token'ından gelir; 11.5, 13.5,
- The Settle Rule. Basılan düğme blok gibi yerine oturur: büyük düğme 1px iner
- The Still Under Reduce Rule. "Hareketi azalt"ta `--press-*` none olur ve yer değiştiren her
- The Raised Selection Rule. Seçili öğe zeminden bir blok kadar yükselir (voxel yüzü);
Elevation:
- Kart kenarı: --card-edge
- Voxel yüzü: --voxel-face
- Birincil parıltı: --primary-glow
- Çökük şerit (segmented: inset 0 0 0 1px line, inset 0 2px 0 rgba(60,40,20,.06)): seçim
Don't:
- Don't bir ekranda birden fazla dolgulu terracotta buton kullanma.
- Don't paragraf, buton yazısı ya da form etiketini piksel yazıyla dizme.
- Don't koyu modda soğuk gri ya da saf siyah zemin kullanma.
- Don't soluk terracottayı pasif durum için kullanma; pasif birincil nötr kâğıda döner.
- Don't bir bağlam içinde `.site-btn`'i yeniden tanımlama; boyut gerekiyorsa `--small` / `--lg` /
Do:
- Do piksel yazıyı yalnızca 22 / 33 / 44 / 55px'te, 500 ağırlıkta, 0 harf aralığıyla kullan.
- (+5 more)
Full: .impeccable/design-full.md (read a section when you need its detail)
