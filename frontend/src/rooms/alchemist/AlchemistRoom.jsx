import AlchemistRoom1 from './AlchemistRoom1'
import AlchemistRoom2 from './AlchemistRoom2'
import AlchemistRoom3 from './AlchemistRoom3'
import AlchemistRoom4 from './AlchemistRoom4'
import AlchemistRoom5 from './AlchemistRoom5'
import AlchemistRoom6 from './AlchemistRoom6'
import AlchemistRoom7 from './AlchemistRoom7'
import AlchemistRoom8 from './AlchemistRoom8'
import AlchemistRoom9 from './AlchemistRoom9'
import AlchemistRoom10 from './AlchemistRoom10'

const ROOMS = [
  AlchemistRoom1,
  AlchemistRoom2,
  AlchemistRoom3,
  AlchemistRoom4,
  AlchemistRoom5,
  AlchemistRoom6,
  AlchemistRoom7,
  AlchemistRoom8,
  AlchemistRoom9,
  AlchemistRoom10,
]

// Oda kapasitesine (1-10) göre doğru simyacı odasını seçer.
export default function AlchemistRoom({ capacity = 1, ...props }) {
  const index = Math.min(Math.max(Math.round(capacity), 1), ROOMS.length) - 1
  const Room = ROOMS[index]
  return <Room {...props} />
}
