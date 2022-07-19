/* 

Book Search Engine
Book.js

Configure schema to have an array of authors, description, bookId, image, link, title

*/

const { Schema } = require('mongoose');

const bookSchema = new Schema({
  authors: [
    {
      type: String
    }
  ],
  description: {
    type: String
  },
  bookId: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  link: {
    type: String
  },
  title: {
    type: String,
    required: true
  }
});

module.exports = bookSchema;
