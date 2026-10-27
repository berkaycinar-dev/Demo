import OfficeRoom1 from './OfficeRoom1'
import OfficeRoom2 from './OfficeRoom2'
import OfficeRoom3 from './OfficeRoom3'
import OfficeRoom4 from './OfficeRoom4'
import OfficeRoom5 from './OfficeRoom5'
import OfficeRoom6 from './OfficeRoom6'
import OfficeRoom7 from './OfficeRoom7'
import OfficeRoom8 from './OfficeRoom8'
import OfficeRoom9 from './OfficeRoom9'
import OfficeRoom10 from './OfficeRoom10'

const ROOMS = [
  OfficeRoom1,
  OfficeRoom2,
  OfficeRoom3,
  OfficeRoom4,
  OfficeRoom5,
  OfficeRoom6,
  OfficeRoom7,
  OfficeRoom8,
  OfficeRoom9,
  OfficeRoom10,
]

// Oda kapasitesine (1-10) göre doğru ofis odasını seçer.
export default function OfficeRoom({ capacity = 1, ...props }) {
  const index = Math.min(Math.max(Math.round(capacity), 1), ROOMS.length) - 1
  const Room = ROOMS[index]
  return <Room {...props} />
}
