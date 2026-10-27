import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

/**
 * frameloop="demand" sahnede animasyon için saniyede fps kare ister. Bir temadaki tüm efektler
 * (ateş, buhar, manzara...) aynı zamanlayıcıyı paylaşır; her efekt kendi aralığını kurarsa
 * istenen kare sayısı katlanır. Hareketi azalt açıkken hiç render edilmemeli.
 */
export default function AnimationTicker({ fps }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    const id = setInterval(() => invalidate(), 1000 / fps)
    return () => clearInterval(id)
  }, [fps, invalidate])
  return null
}
