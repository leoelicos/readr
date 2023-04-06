export const searchGoogleBooks = (query) => fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}`)
