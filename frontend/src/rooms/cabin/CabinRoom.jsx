import CabinRoom1 from './CabinRoom1'
import CabinRoom2 from './CabinRoom2'
import CabinRoom3 from './CabinRoom3'
import CabinRoom4 from './CabinRoom4'
import CabinRoom5 from './CabinRoom5'
import CabinRoom6 from './CabinRoom6'
import CabinRoom7 from './CabinRoom7'
import CabinRoom8 from './CabinRoom8'
import CabinRoom9 from './CabinRoom9'
import CabinRoom10 from './CabinRoom10'

const ROOMS = [
  CabinRoom1,
  CabinRoom2,
  CabinRoom3,
  CabinRoom4,
  CabinRoom5,
  CabinRoom6,
  CabinRoom7,
  CabinRoom8,
  CabinRoom9,
  CabinRoom10,
]

// Oda kapasitesine (1-10) göre doğru dağ evi odasını seçer.
export default function CabinRoom({ capacity = 1, ...props }) {
  const index = Math.min(Math.max(Math.round(capacity), 1), ROOMS.length) - 1
  const Room = ROOMS[index]
  return <Room {...props} />
}
