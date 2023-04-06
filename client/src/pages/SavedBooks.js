import React from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { Jumbotron, Container, CardColumns, Card, Button } from 'react-bootstrap'
import { REMOVE_BOOK } from '../utils/mutations'
import { GET_ME } from '../utils/queries'
import Auth from '../utils/auth'
import { removeBookId } from '../utils/localStorage'

const SavedBooks = () => {
  // get me
  const { loading, data: userData } = useQuery(GET_ME)

  // remove book
  const [removeBook] = useMutation(REMOVE_BOOK)

  // decode jwt and check user is logged in
  const token = Auth.loggedIn() ? Auth.getToken() : null
  if (!token) return false

  // remove book
  // remove bookid from local storage
  const handleDeleteBook = async (bookId) => {
    try {
      await removeBook({ variables: { bookId: bookId } })
    } catch (err) {
      console.error(err)
    }
    removeBookId(bookId)
  }

  return (
    <>
      {/* Jumbotron */}
      <Jumbotron
        fluid
        className='text-light bg-dark'>
        <Container>
          <h1>Viewing saved books!</h1>
        </Container>
      </Jumbotron>

      {/* Rendered data */}
      <Container>
        {loading ? (
          <h2>Loading saved books…</h2>
        ) : (
          <>
            {/* Heading displaying number of books */}
            <h2>
              {userData.me.bookCount
                ? //
                  `Viewing ${userData.me.bookCount} saved ${userData.me.bookCount === 1 ? 'book' : 'books'}:`
                : 'You have no saved books!'}
            </h2>

            {/* CardColumns show saved books */}
            <CardColumns>
              {userData.me.savedBooks.map((book) => {
                return (
                  <Card
                    key={book.bookId}
                    border='dark'>
                    {/* book image */}
                    {book.image ? (
                      <Card.Img
                        src={book.image}
                        alt={`The cover for ${book.title}`}
                        variant='top'
                      />
                    ) : null}

                    {/* book data */}
                    <Card.Body>
                      {/* title */}
                      <Card.Title>{book.title}</Card.Title>
                      {/* authors */}
                      <p className='small'>Authors: {book.authors}</p>
                      {/* description */}
                      <Card.Text>{book.description}</Card.Text>
                      {/* delete button */}
                      <Button
                        className='btn-block btn-danger'
                        onClick={() => handleDeleteBook(book.bookId)}>
                        Delete this Book!
                      </Button>
                    </Card.Body>
                  </Card>
                )
              })}
            </CardColumns>
          </>
        )}
      </Container>
    </>
  )
}

export default SavedBooks
