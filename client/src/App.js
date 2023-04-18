import React from 'react'
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SearchBooks from './pages/SearchBooks'
import SavedBooks from './pages/SavedBooks'
import Navbar from './components/Navbar'

/* custom hooks */
import useTitle from './hooks/useTitle.js'
import useFavicon from './hooks/useFavicon.js'

/* configure Apollo client to use token from local storage in Apollo client's context */
const httpLink = createHttpLink({ uri: 'https://readr-iktp.onrender.com/graphql' })
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('id_token')
  return { headers: { ...headers, authorization: token ? `Bearer ${token}` : '' } }
})
const client = new ApolloClient({ link: authLink.concat(httpLink), cache: new InMemoryCache() })

export default function App() {
  useTitle('Readr')
  useFavicon('./images/readr.png')

  return (
    // apollo client
    <ApolloProvider client={client}>
      <Router>
        <>
          <Navbar />
          <Routes>
            {/* search books */}
            <Route
              path='/'
              element={<SearchBooks />}
            />

            {/* saved books */}
            <Route
              path='/saved'
              element={<SavedBooks />}
            />

            {/* wildcard route */}
            <Route
              path='*'
              element={<h1 className='display-2'>Wrong page!</h1>}
            />
          </Routes>
        </>
      </Router>
    </ApolloProvider>
  )
}
