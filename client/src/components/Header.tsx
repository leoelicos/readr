import { NavLink, Link } from 'react-router';
import { useAuth } from '../lib/auth';
import { useShelf, useTheme } from '../lib/hooks';
import { useToast } from '../lib/toast';
import { Icon } from './Icon';
import { Logo } from './Logo';

export function Header() {
  const { token, profile, openAuth, signOut } = useAuth();
  const { me } = useShelf();
  const { notify } = useToast();
  const [theme, toggleTheme] = useTheme();
  const count = me?.bookCount ?? 0;

  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link to="/" className="brand" viewTransition>
          <Logo />
          <span>Readr</span>
        </Link>

        <nav aria-label="Main" className="main-nav">
          <ul role="list">
            <li>
              <NavLink to="/" end viewTransition>
                <Icon name="search" size={18} />
                <span>Search</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/shelf" viewTransition>
                <Icon name="bookmark" size={18} />
                <span>
                  Shelf
                  {token && count ? (
                    <>
                      <span className="badge" aria-hidden="true">
                        {count}
                      </span>{' '}
                      <span className="sr-only">{`(${count} ${count === 1 ? 'book' : 'books'})`}</span>
                    </>
                  ) : null}
                </span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          {token ? (
            <>
              <span className="who" title={profile?.email}>
                <Icon name="user" size={18} />
                <span className="who-name">{profile?.username}</span>
              </span>
              <button
                type="button"
                className="btn btn-small btn-ghost"
                onClick={async () => {
                  await signOut();
                  notify({ message: 'You’re signed out. See you soon.' });
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-small btn-primary"
              onClick={() => openAuth('login')}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
