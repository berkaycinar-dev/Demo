import AvatarLab from './avatars/AvatarLab'
import RoomPreview from './rooms/RoomPreview'
import Site from './site/Site'

// ?theme=... ile açılırsa geliştirme önizlemesi (ekran görüntüsü ve kontrol araçları bunu kullanır),
// ?lab=avatars ile bütün avatar hareketleri, aksi hâlde sitenin test arayüzü.
const params = new URLSearchParams(window.location.search)

function App() {
  if (params.get('lab') === 'avatars') return <AvatarLab />
  return params.has('theme') ? <RoomPreview /> : <Site />
}

export default App
