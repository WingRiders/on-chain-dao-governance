import {useState, useEffect} from 'react'

export const useTime = (updateInterval: number) => {
  const [time, setTime] = useState(Date.now())

  useEffect(() => {
    const handle = setInterval(() => setTime(Date.now()), updateInterval)
    return () => clearInterval(handle)
  }, [updateInterval])

  return time
}
