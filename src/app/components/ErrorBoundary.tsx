import { useRouteError, useNavigate } from 'react-router';
import { AlertCircle, Home } from 'lucide-react';

export function ErrorBoundary() {
  const error = useRouteError() as any;
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-gray-900">Something went wrong</h1>
            <p className="text-sm text-gray-500">
              {error?.status === 404 ? 'Page not found' : 'An error occurred'}
            </p>
          </div>
        </div>
        
        {error?.statusText && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">{error.statusText}</p>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
