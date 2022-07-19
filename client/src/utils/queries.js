import { gql } from '@apollo/client';

export const ME = gql`
  query GetSingleUser {
    me {
      _id
      username
      email
      password
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
