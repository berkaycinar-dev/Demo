import TeaGardenRoom1 from './TeaGardenRoom1'
import TeaGardenRoom2 from './TeaGardenRoom2'
import TeaGardenRoom3 from './TeaGardenRoom3'
import TeaGardenRoom4 from './TeaGardenRoom4'
import TeaGardenRoom5 from './TeaGardenRoom5'
import TeaGardenRoom6 from './TeaGardenRoom6'
import TeaGardenRoom7 from './TeaGardenRoom7'
import TeaGardenRoom8 from './TeaGardenRoom8'
import TeaGardenRoom9 from './TeaGardenRoom9'
import TeaGardenRoom10 from './TeaGardenRoom10'

const ROOMS = [
  TeaGardenRoom1,
  TeaGardenRoom2,
  TeaGardenRoom3,
  TeaGardenRoom4,
  TeaGardenRoom5,
  TeaGardenRoom6,
  TeaGardenRoom7,
  TeaGardenRoom8,
  TeaGardenRoom9,
  TeaGardenRoom10,
]

// Oda kapasitesine (1-10) göre doğru çay bahçesi odasını seçer.
export default function TeaGardenRoom({ capacity = 1, ...props }) {
  const index = Math.min(Math.max(Math.round(capacity), 1), ROOMS.length) - 1
  const Room = ROOMS[index]
  return <Room {...props} />
}
