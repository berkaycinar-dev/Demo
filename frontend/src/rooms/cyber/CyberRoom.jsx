import CyberRoom1 from './CyberRoom1'
import CyberRoom2 from './CyberRoom2'
import CyberRoom3 from './CyberRoom3'
import CyberRoom4 from './CyberRoom4'
import CyberRoom5 from './CyberRoom5'
import CyberRoom6 from './CyberRoom6'
import CyberRoom7 from './CyberRoom7'
import CyberRoom8 from './CyberRoom8'
import CyberRoom9 from './CyberRoom9'
import CyberRoom10 from './CyberRoom10'

const ROOMS = [
  CyberRoom1,
  CyberRoom2,
  CyberRoom3,
  CyberRoom4,
  CyberRoom5,
  CyberRoom6,
  CyberRoom7,
  CyberRoom8,
  CyberRoom9,
  CyberRoom10,
]

// Oda kapasitesine (1-10) göre doğru Siber Loft odasını seçer.
export default function CyberRoom({ capacity = 1, ...props }) {
  const index = Math.min(Math.max(Math.round(capacity), 1), ROOMS.length) - 1
  const Room = ROOMS[index]
  return <Room {...props} />
}
