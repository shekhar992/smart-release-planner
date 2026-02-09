import { Link } from 'react-router';
import { Button } from '../components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-neutral-500 mb-6">Page not found</p>
        <Link to="/">
          <Button>Back to Releases</Button>
        </Link>
      </div>
    </div>
  );
}
