import { BAR_MAX_CAPACITY, BarRoom } from './bar'
import { CABIN_MAX_CAPACITY, CabinRoom } from './cabin'
import { CAMP_MAX_CAPACITY, CampRoom } from './camp'
import { CYBER_MAX_CAPACITY, CyberRoom } from './cyber'
import { LIBRARY_MAX_CAPACITY, LibraryRoom } from './library'
import { OFFICE_MAX_CAPACITY, OfficeRoom } from './office'
import { SPACE_MAX_CAPACITY, SpaceRoom } from './space'
import { TEAGARDEN_MAX_CAPACITY, TeaGardenRoom } from './teagarden'
import { TREEHOUSE_MAX_CAPACITY, TreehouseRoom } from './treehouse'
import { UNDERWATER_MAX_CAPACITY, UnderwaterRoom } from './underwater'

// Tüm oda temaları: geliştirme önizlemesi ve sitedeki tema seçimi buradan okur.
// Room: kapasiteye göre (1-max) doğru odayı seçen bileşen.
export const THEMES = {
  library: { label: 'Kütüphane', description: 'kitap rafları, okuma köşesi, çay', Room: LibraryRoom, max: LIBRARY_MAX_CAPACITY },
  cabin: { label: 'Dağ Evi', description: 'şömine, karlı pencereler, kakao', Room: CabinRoom, max: CABIN_MAX_CAPACITY },
  office: { label: 'Yazılım Ofisi', description: 'monitörler, şehir manzarası, kahve barı', Room: OfficeRoom, max: OFFICE_MAX_CAPACITY },
  teagarden: { label: 'Çay Bahçesi', description: 'deniz manzarası, semaver, çınar', Room: TeaGardenRoom, max: TEAGARDEN_MAX_CAPACITY },
  camp: { label: 'Kamp', description: 'göl kenarı, kamp ateşi, çadırlar', Room: CampRoom, max: CAMP_MAX_CAPACITY },
  space: { label: 'Uzay İstasyonu', description: 'gezegen manzarası, hologram masa', Room: SpaceRoom, max: SPACE_MAX_CAPACITY },
  underwater: { label: 'Sualtı Üssü', description: 'akvaryum camı, sonar, denizanaları', Room: UnderwaterRoom, max: UNDERWATER_MAX_CAPACITY },
  bar: { label: 'Bar', description: 'yağmurlu sokak, neon, müzik kutusu', Room: BarRoom, max: BAR_MAX_CAPACITY },
  treehouse: { label: 'Ağaç Ev', description: 'ağaç gövdesi, hamak, ateş böcekleri', Room: TreehouseRoom, max: TREEHOUSE_MAX_CAPACITY },
  cyber: { label: 'Siber Loft', description: 'neon kent manzarası, hologram masa, sunucular', Room: CyberRoom, max: CYBER_MAX_CAPACITY },
}
