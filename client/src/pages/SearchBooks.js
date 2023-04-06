import React, { useState, useEffect } from 'react'
import { Jumbotron, Container, Col, Form, Button, Card, CardColumns } from 'react-bootstrap'
import Auth from '../utils/auth'
import { useMutation } from '@apollo/client'
import { searchGoogleBooks } from '../utils/API'
import { SAVE_BOOK } from '../utils/mutations'
import { saveBookIds, getSavedBookIds } from '../utils/localStorage'

const SearchBooks = () => {
  // searched books
  const [searchedBooks, setSearchedBooks] = useState([])

  // search input
  const [searchInput, setSearchInput] = useState('')

  // saved book ids
  const [savedBookIds, setSavedBookIds] = useState(getSavedBookIds())

  // save book
  const [saveBook] = useMutation(SAVE_BOOK)

  // when this page closes, this cleanup function executes saveBookIds() which saves books in local storage
  useEffect(() => {
    return () => saveBookIds(savedBookIds)
  })

  // google books, searched books, search input
  const handleFormSubmit = async (event) => {
    event.preventDefault()

    if (!searchInput) return false

    try {
      const response = await searchGoogleBooks(searchInput)
      if (!response.ok) throw new Error('something went wrong!')

      const { items } = await response.json()

      const bookData = items.map((book) => ({
        bookId: book.id,
        authors: book.volumeInfo.authors || ['No author to display'],
        title: book.volumeInfo.title,
        description: book.volumeInfo.description,
        image: book.volumeInfo.imageLinks?.thumbnail || ''
      }))

      setSearchedBooks(bookData)
      setSearchInput('')
    } catch (err) {
      console.error(err)
    }
  }

  /* save book, saved book ids */
  const handleSaveBook = async (bookId) => {
    const bookToSave = searchedBooks.find((book) => book.bookId === bookId)

    const token = Auth.loggedIn() ? Auth.getToken() : null

    if (!token) return false

    try {
      const payload = { variables: { input: { ...bookToSave } } }
      const { data } = await saveBook(payload)
      data && setSavedBookIds([...savedBookIds, bookToSave.bookId])
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      {/* Jumbotron */}
      <Jumbotron
        fluid
        className='text-light bg-dark'>
        <Container>
          {/* heading */}
          <h1>Search for Books!</h1>

          {/* form to search book */}
          <Form onSubmit={handleFormSubmit}>
            <Form.Row>
              {/* input */}
              <Col
                xs={12}
                md={8}>
                <Form.Control
                  name='searchInput'
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type='text'
                  size='lg'
                  placeholder='Search for a book'
                />
              </Col>

              {/* submit button */}
              <Col
                xs={12}
                md={4}>
                <Button
                  type='submit'
                  variant='success'
                  size='lg'>
                  Submit Search
                </Button>
              </Col>
            </Form.Row>
          </Form>
        </Container>
      </Jumbotron>

      <Container>
        {/* heading for search results */}
        <h2>{searchedBooks.length ? `Viewing ${searchedBooks.length} results:` : 'Search for a book to begin'}</h2>
        {/* rendered search results */}
        <CardColumns>
          {/* iterate through list of books */}
          {searchedBooks.map((book) => {
            return (
              <Card
                key={book.bookId}
                border='dark'>
                {/* if book exists, render it */}
                {book.image ? (
                  <Card.Img
                    src={book.image}
                    alt={`The cover for ${book.title}`}
                    variant='top'
                  />
                ) : null}
                <Card.Body>
                  {/* title */}
                  <Card.Title>{book.title}</Card.Title>
                  {/* authors */}
                  <p className='small'>Authors: {book.authors}</p>
                  {/* description */}
                  <Card.Text>{book.description}</Card.Text>

                  {/* if logged in, render button 'Save this book'*/}
                  {/* if logged in and bookId exists in local state, render disabled button 'This book has already been saved' */}
                  {Auth.loggedIn() && (
                    <Button
                      disabled={savedBookIds?.some((savedBookId) => savedBookId === book.bookId)}
                      className='btn-block btn-info'
                      onClick={() => handleSaveBook(book.bookId)}>
                      {savedBookIds?.some((savedBookId) => savedBookId === book.bookId) ? 'This book has already been saved!' : 'Save this Book!'}
                    </Button>
                  )}
                </Card.Body>
              </Card>
            )
          })}
        </CardColumns>
      </Container>
    </>
  )
}

export default SearchBooks
