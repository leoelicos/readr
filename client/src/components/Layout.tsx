import { useEffect, useRef } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { useSessionGuard } from '../lib/hooks';
import { AuthDialog } from './AuthDialog';
import { Footer } from './Footer';
import { Header } from './Header';

/** After client-side navigation, move focus to the new page's <h1> so screen readers announce it. */
function useRouteFocus() {
  const { pathname } = useLocation();
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current === pathname) return; // first render: leave focus where the browser put it
    previous.current = pathname;
    document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
  }, [pathname]);
}

export function Layout() {
  useRouteFocus();
  useSessionGuard();
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <AuthDialog />
      <ScrollRestoration />
    </>
  );
}
