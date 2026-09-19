"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="app-shell">
      <h1 className="page-title">Something went wrong</h1>
      <p className="lede">Try again, or return to the home screen.</p>
      <button type="button" className="add-btn" onClick={reset}>
        Retry
      </button>
    </div>
  );
}
