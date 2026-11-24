import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { session } from './session';

const uri = import.meta.env.VITE_GRAPHQL_URL || '/graphql';

const authLink = new SetContextLink(({ headers }) => {
  const token = session.getToken();
  return { headers: { ...headers, ...(token ? { authorization: `Bearer ${token}` } : {}) } };
});

export function createApolloClient(link = authLink.concat(new HttpLink({ uri }))) {
  return new ApolloClient({
    link,
    cache: new InMemoryCache({
      typePolicies: {
        User: { fields: { savedBooks: { merge: false } } },
        Book: { keyFields: ['bookId'] },
      },
    }),
  });
}
