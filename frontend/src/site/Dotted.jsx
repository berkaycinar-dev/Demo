import { Fragment } from 'react'

// "·" ayraçlı metin. Ayraç kendinden önceki sözcüğe bölünmez boşlukla bağlanır, satır yalnızca ayraçtan
// sonra kırılır: ikinci satır hiçbir zaman "·" ile başlamaz.
//   <Dotted text={room.name} />             oda adı gibi serbest metin; parçaların içi yine kırılabilir
//   <Dotted parts={[a, b, c]} keep />       üst bilgi satırı; her parça kendi içinde bütün kalır
//                                           ("7 kişilik" ortadan bölünmez), kırılma yalnızca ayraçlarda
export default function Dotted({ text, parts, keep = false }) {
  const list = (parts ?? String(text ?? '').split(' · ')).filter((p) => p !== null && p !== undefined && p !== '')
  return list.map((p, i) => (
    <Fragment key={i}>
      {i > 0 && ' · '}
      {keep ? <span className="nobreak">{p}</span> : p}
    </Fragment>
  ))
}
