import BarRoom1 from './BarRoom1'
import BarRoom2 from './BarRoom2'
import BarRoom3 from './BarRoom3'
import BarRoom4 from './BarRoom4'
import BarRoom5 from './BarRoom5'
import BarRoom6 from './BarRoom6'
import BarRoom7 from './BarRoom7'
import BarRoom8 from './BarRoom8'
import BarRoom9 from './BarRoom9'
import BarRoom10 from './BarRoom10'

const ROOMS = [
  BarRoom1,
  BarRoom2,
  BarRoom3,
  BarRoom4,
  BarRoom5,
  BarRoom6,
  BarRoom7,
  BarRoom8,
  BarRoom9,
  BarRoom10,
]

// Oda kapasitesine (1-10) göre doğru bar odasını seçer.
export default function BarRoom({ capacity = 1, ...props }) {
  const index = Math.min(Math.max(Math.round(capacity), 1), ROOMS.length) - 1
  const Room = ROOMS[index]
  return <Room {...props} />
}
