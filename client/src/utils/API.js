/* 

Book Search Engine
API.js
searchGoogleBooks is a function that fetches GET request to Google Books API

*/

export const searchGoogleBooks = (query) => fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}`);
