import { gql } from '@apollo/client';

export const ME = gql`
  query GetSingleUser {
    me {
      _id
      username
      email
      bookCount
      savedBooks {
        _id
        authors
        description
        bookId
        image
        link
        title
      }
    }
  }
`;
