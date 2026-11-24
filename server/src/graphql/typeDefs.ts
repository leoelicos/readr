// The `#graphql` tag gives editors syntax highlighting without a runtime gql dependency.
export const typeDefs = /* GraphQL */ `
  #graphql
  type User {
    _id: ID!
    username: String!
    email: String!
    bookCount: Int!
    savedBooks: [Book!]!
  }

  type Book {
    _id: ID
    bookId: String!
    title: String!
    authors: [String!]
    description: String
    image: String
    link: String
  }

  input BookInput {
    bookId: String!
    title: String!
    authors: [String!]
    description: String
    image: String
    link: String
  }

  type Auth {
    token: ID!
    user: User!
  }

  type Query {
    "The signed-in user, or an UNAUTHENTICATED error."
    me: User
  }

  type Mutation {
    addUser(username: String!, email: String!, password: String!): Auth!
    login(email: String!, password: String!): Auth!
    saveBook(input: BookInput!): User
    removeBook(bookId: String!): User
  }
`;
