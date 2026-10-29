import TreehouseRoom1 from './TreehouseRoom1'
import TreehouseRoom2 from './TreehouseRoom2'
import TreehouseRoom3 from './TreehouseRoom3'
import TreehouseRoom4 from './TreehouseRoom4'
import TreehouseRoom5 from './TreehouseRoom5'
import TreehouseRoom6 from './TreehouseRoom6'
import TreehouseRoom7 from './TreehouseRoom7'
import TreehouseRoom8 from './TreehouseRoom8'
import TreehouseRoom9 from './TreehouseRoom9'
import TreehouseRoom10 from './TreehouseRoom10'

const ROOMS = [
  TreehouseRoom1,
  TreehouseRoom2,
  TreehouseRoom3,
  TreehouseRoom4,
  TreehouseRoom5,
  TreehouseRoom6,
  TreehouseRoom7,
  TreehouseRoom8,
  TreehouseRoom9,
  TreehouseRoom10,
]

// Oda kapasitesine (1-10) göre doğru ağaç ev odasını seçer.
export default function TreehouseRoom({ capacity = 1, ...props }) {
  const index = Math.min(Math.max(Math.round(capacity), 1), ROOMS.length) - 1
  const Room = ROOMS[index]
  return <Room {...props} />
}
