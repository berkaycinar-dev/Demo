import { createContext, useContext } from 'react'

// Oda verisi: { seats, spots, bounds }. Avatarlar koltuk ve mola noktalarını buradan okur.
export const RoomContext = createContext(null)

// O anki gün zamanı ön ayarı (TIME_PRESETS içinden biri).
export const TimeOfDayContext = createContext(null)

export const useRoom = () => useContext(RoomContext)
export const useTimeOfDay = () => useContext(TimeOfDayContext)
