import { ApolloProvider } from '@apollo/client/react';
import { useState } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { Layout } from './components/Layout';
import { createApolloClient } from './lib/apollo';
import { AuthProvider } from './lib/auth';
import { session } from './lib/session';
import { ToastProvider } from './lib/toast';
import NotFoundPage from './pages/NotFoundPage';
import SearchPage from './pages/SearchPage';
import ShelfPage from './pages/ShelfPage';

export const routes = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <SearchPage /> },
      { path: 'shelf', element: <ShelfPage /> },
      // v1 URL, kept so old bookmarks still work.
      { path: 'saved', element: <Navigate to="/shelf" replace /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function Providers({
  children,
  client,
}: {
  children: React.ReactNode;
  client?: ReturnType<typeof createApolloClient>;
}) {
  const [apollo] = useState(() => client ?? createApolloClient());
  return (
    <ApolloProvider client={apollo}>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </ApolloProvider>
  );
}

const router = createBrowserRouter(routes);
session.clearLegacy();

export default function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
