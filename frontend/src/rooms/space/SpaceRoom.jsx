import SpaceRoom1 from './SpaceRoom1'
import SpaceRoom2 from './SpaceRoom2'
import SpaceRoom3 from './SpaceRoom3'
import SpaceRoom4 from './SpaceRoom4'
import SpaceRoom5 from './SpaceRoom5'
import SpaceRoom6 from './SpaceRoom6'
import SpaceRoom7 from './SpaceRoom7'
import SpaceRoom8 from './SpaceRoom8'
import SpaceRoom9 from './SpaceRoom9'
import SpaceRoom10 from './SpaceRoom10'

const ROOMS = [
  SpaceRoom1,
  SpaceRoom2,
  SpaceRoom3,
  SpaceRoom4,
  SpaceRoom5,
  SpaceRoom6,
  SpaceRoom7,
  SpaceRoom8,
  SpaceRoom9,
  SpaceRoom10,
]

// Oda kapasitesine (1-10) göre doğru uzay istasyonu odasını seçer.
export default function SpaceRoom({ capacity = 1, ...props }) {
  const index = Math.min(Math.max(Math.round(capacity), 1), ROOMS.length) - 1
  const Room = ROOMS[index]
  return <Room {...props} />
}
