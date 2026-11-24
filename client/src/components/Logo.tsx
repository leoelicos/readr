export function Logo() {
  return (
    <svg
      className="logo"
      viewBox="0 0 32 32"
      width="32"
      height="32"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="5" width="7" height="22" rx="1.5" fill="var(--accent)" />
      <rect x="11.5" y="3" width="6" height="24" rx="1.5" fill="currentColor" />
      <rect
        x="19"
        y="6.5"
        width="6"
        height="21"
        rx="1.5"
        transform="rotate(-14 22 17)"
        fill="var(--accent-2)"
      />
      <path d="M2 28.5h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
