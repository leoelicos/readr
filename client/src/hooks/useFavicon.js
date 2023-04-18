import { useEffect } from 'react'

const useFavicon = (src) => {
  useEffect(() => {
    document.querySelector('#favicon').setAttribute('href', src)
    return () => {
      document.querySelector('#favicon').setAttribute('href', src)
    }
  }, [src])
}
export default useFavicon
