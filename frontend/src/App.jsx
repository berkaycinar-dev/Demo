import RoomPreview from './rooms/RoomPreview'
import Site from './site/Site'

// ?theme=... ile açılırsa geliştirme önizlemesi (ekran görüntüsü ve kontrol araçları bunu kullanır),
// aksi hâlde sitenin test arayüzü.
const isRoomPreview = new URLSearchParams(window.location.search).has('theme')

function App() {
  return isRoomPreview ? <RoomPreview /> : <Site />
}

export default App
