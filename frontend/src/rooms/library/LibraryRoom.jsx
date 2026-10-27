import LibraryRoom1 from './LibraryRoom1'
import LibraryRoom2 from './LibraryRoom2'
import LibraryRoom3 from './LibraryRoom3'
import LibraryRoom4 from './LibraryRoom4'
import LibraryRoom5 from './LibraryRoom5'
import LibraryRoom6 from './LibraryRoom6'
import LibraryRoom7 from './LibraryRoom7'
import LibraryRoom8 from './LibraryRoom8'
import LibraryRoom9 from './LibraryRoom9'
import LibraryRoom10 from './LibraryRoom10'

const ROOMS = [
  LibraryRoom1,
  LibraryRoom2,
  LibraryRoom3,
  LibraryRoom4,
  LibraryRoom5,
  LibraryRoom6,
  LibraryRoom7,
  LibraryRoom8,
  LibraryRoom9,
  LibraryRoom10,
]

// Oda kapasitesine (1-10) göre doğru kütüphane odasını seçer.
export default function LibraryRoom({ capacity = 1, ...props }) {
  const index = Math.min(Math.max(Math.round(capacity), 1), ROOMS.length) - 1
  const Room = ROOMS[index]
  return <Room {...props} />
}
