import { gql, type TypedDocumentNode } from '@apollo/client';

export interface SavedBook {
  __typename?: 'Book';
  _id?: string | null;
  bookId: string;
  title: string;
  authors?: string[] | null;
  description?: string | null;
  image?: string | null;
  link?: string | null;
}

export interface Me {
  __typename?: 'User';
  _id: string;
  username: string;
  email: string;
  bookCount: number;
  savedBooks: SavedBook[];
}

export interface AuthPayload {
  token: string;
  user: Pick<Me, '_id' | 'username' | 'email' | 'bookCount'>;
}

export type BookInput = Omit<SavedBook, '__typename' | '_id'>;

const USER_FIELDS = gql`
  fragment UserFields on User {
    _id
    username
    email
    bookCount
    savedBooks {
      _id
      bookId
      title
      authors
      description
      image
      link
    }
  }
`;

export const GET_ME: TypedDocumentNode<{ me: Me | null }, Record<string, never>> = gql`
  query Me {
    me {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const LOGIN: TypedDocumentNode<{ login: AuthPayload }, { email: string; password: string }> =
  gql`
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        token
        user {
          _id
          username
          email
          bookCount
        }
      }
    }
  `;

export const ADD_USER: TypedDocumentNode<
  { addUser: AuthPayload },
  { username: string; email: string; password: string }
> = gql`
  mutation AddUser($username: String!, $email: String!, $password: String!) {
    addUser(username: $username, email: $email, password: $password) {
      token
      user {
        _id
        username
        email
        bookCount
      }
    }
  }
`;

export const SAVE_BOOK: TypedDocumentNode<{ saveBook: Me | null }, { input: BookInput }> = gql`
  mutation SaveBook($input: BookInput!) {
    saveBook(input: $input) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const REMOVE_BOOK: TypedDocumentNode<{ removeBook: Me | null }, { bookId: string }> = gql`
  mutation RemoveBook($bookId: String!) {
    removeBook(bookId: $bookId) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;
