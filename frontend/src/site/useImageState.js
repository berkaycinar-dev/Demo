import { useCallback, useState } from 'react'

// Görselin yüklenme durumu: 'loading' | 'ready' | 'error'. Kapsayıcı data-state ile iskelet (yüklenirken)
// ve yer tutucu (yüklenemezse) gösterir; kırık resim simgesi hiç görünmez. Önbellekten anında gelen
// görsel ref anında 'ready' sayılır (onLoad kaçırılmasın).
export default function useImageState() {
  const [state, setState] = useState('loading')
  const ref = useCallback((img) => {
    if (img?.complete) setState(img.naturalWidth > 0 ? 'ready' : 'error')
  }, [])
  return [state, { ref, onLoad: () => setState('ready'), onError: () => setState('error') }]
}
