import { Link } from 'react-router';
import { useDocumentTitle } from '../lib/hooks';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <section className="hero not-found" aria-labelledby="page-title">
      <div className="wrap hero-inner">
        <p className="eyebrow">Error 404</p>
        <h1 id="page-title" tabIndex={-1}>
          This page has been <em>checked out</em>.
        </h1>
        <p className="lede">We couldn’t find what you were looking for.</p>
        <Link to="/" className="btn btn-primary" viewTransition>
          Back to search
        </Link>
      </div>
    </section>
  );
}
