import { useEffect } from 'react'

const useTitle = (src) => {
  useEffect(() => {
    const originalTitle = document.querySelector('#title').textContent
    document.querySelector('#title').textContent = src
    return () => {
      document.querySelector('#favicon').textContent = originalTitle
    }
  }, [src])
}
export default useTitle
