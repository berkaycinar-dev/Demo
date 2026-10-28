import UnderwaterRoom1 from './UnderwaterRoom1'
import UnderwaterRoom2 from './UnderwaterRoom2'
import UnderwaterRoom3 from './UnderwaterRoom3'
import UnderwaterRoom4 from './UnderwaterRoom4'
import UnderwaterRoom5 from './UnderwaterRoom5'
import UnderwaterRoom6 from './UnderwaterRoom6'
import UnderwaterRoom7 from './UnderwaterRoom7'
import UnderwaterRoom8 from './UnderwaterRoom8'
import UnderwaterRoom9 from './UnderwaterRoom9'
import UnderwaterRoom10 from './UnderwaterRoom10'

const ROOMS = [
  UnderwaterRoom1,
  UnderwaterRoom2,
  UnderwaterRoom3,
  UnderwaterRoom4,
  UnderwaterRoom5,
  UnderwaterRoom6,
  UnderwaterRoom7,
  UnderwaterRoom8,
  UnderwaterRoom9,
  UnderwaterRoom10,
]

// Oda kapasitesine (1-10) göre doğru sualtı üssü odasını seçer.
export default function UnderwaterRoom({ capacity = 1, ...props }) {
  const index = Math.min(Math.max(Math.round(capacity), 1), ROOMS.length) - 1
  const Room = ROOMS[index]
  return <Room {...props} />
}
