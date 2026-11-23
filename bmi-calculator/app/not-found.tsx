import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 shadow-sm">
        <span className="text-sm font-bold text-accent-primary uppercase tracking-wider">Error 404</span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4">
          Page Not Found
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          The requested page could not be found or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-accent-primary text-white font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary min-h-[44px]"
        >
          Return to Tool
        </Link>
      </div>
    </div>
  );
}
