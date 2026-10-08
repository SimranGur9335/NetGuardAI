import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-6xl font-bold text-gray-200 mb-4">404</div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-sm text-gray-500 mb-6">
        The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-800 transition-colors"
      >
        Return to Overview
      </Link>
    </div>
  );
}
