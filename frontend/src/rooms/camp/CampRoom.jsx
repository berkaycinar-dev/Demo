import CampRoom1 from './CampRoom1'
import CampRoom2 from './CampRoom2'
import CampRoom3 from './CampRoom3'
import CampRoom4 from './CampRoom4'
import CampRoom5 from './CampRoom5'
import CampRoom6 from './CampRoom6'
import CampRoom7 from './CampRoom7'
import CampRoom8 from './CampRoom8'
import CampRoom9 from './CampRoom9'
import CampRoom10 from './CampRoom10'

const ROOMS = [
  CampRoom1,
  CampRoom2,
  CampRoom3,
  CampRoom4,
  CampRoom5,
  CampRoom6,
  CampRoom7,
  CampRoom8,
  CampRoom9,
  CampRoom10,
]

// Oda kapasitesine (1-10) göre doğru kamp odasını seçer.
export default function CampRoom({ capacity = 1, ...props }) {
  const index = Math.min(Math.max(Math.round(capacity), 1), ROOMS.length) - 1
  const Room = ROOMS[index]
  return <Room {...props} />
}
