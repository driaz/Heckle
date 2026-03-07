import { useEffect } from 'react'
import gameDirector from './GameDirector'

export default function GameDirectorManager() {
  useEffect(() => {
    gameDirector.start()
    return () => gameDirector.stop()
  }, [])

  return null
}
