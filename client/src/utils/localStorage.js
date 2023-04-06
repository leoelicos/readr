export const getSavedBookIds = () => {
  const savedBookIds = localStorage.getItem('readr')
    ? //
      JSON.parse(localStorage.getItem('readr'))
    : []

  return savedBookIds
}

export const saveBookIds = (bookIdArr) => {
  if (!bookIdArr.length) {
    localStorage.removeItem('readr')
    return
  }
  localStorage.setItem('readr', JSON.stringify(bookIdArr))
}

export const removeBookId = (bookId) => {
  const savedBookIds = localStorage.getItem('readr')
    ? //
      JSON.parse(localStorage.getItem('readr'))
    : //
      null

  if (!savedBookIds) return false

  const updatedSavedBookIds = savedBookIds?.filter((savedBookId) => savedBookId !== bookId)
  localStorage.setItem('readr', JSON.stringify(updatedSavedBookIds))

  return true
}
