'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TestRedirectPage() {
  const router = useRouter();
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    console.log('🧪 Test: Component mounted');
    const timer = setTimeout(() => {
      console.log('🧪 Test: Attempting redirect...');
      setRedirected(true);
      router.push('/admin/decks');
      console.log('🧪 Test: router.push called');
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">🧪 Test Redirect</h1>
      <p className="text-gray-700 mb-4">
        {redirected ? 'Redirecting...' : 'Will redirect in 1 second...'}
      </p>
      <p className="text-sm text-gray-500">
        Check console for logs
      </p>
    </div>
  );
}
