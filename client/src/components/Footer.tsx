export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <p>
          Book data from{' '}
          <a href="https://books.google.com/" target="_blank" rel="noreferrer">
            Google Books <span className="sr-only">(opens in a new tab)</span>
          </a>
          . Built by{' '}
          <a href="https://github.com/leoelicos" target="_blank" rel="noreferrer">
            Leo Wong <span className="sr-only">(opens in a new tab)</span>
          </a>
          .
        </p>
        <p>
          <a href="https://github.com/leoelicos/readr" target="_blank" rel="noreferrer">
            Source on GitHub <span className="sr-only">(opens in a new tab)</span>
          </a>
        </p>
      </div>
    </footer>
  );
}
