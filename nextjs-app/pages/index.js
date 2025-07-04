import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Screen Capture App</title>
        <meta name="description" content="Screen capture application" />
      </Head>

      <main className="flex flex-col items-center justify-center min-h-[80vh]">
        <h1 className="text-4xl font-bold mb-8">Screen Capture App</h1>
        
        <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-semibold mb-4">Welcome to the Screen Capture App</h2>
          <p className="mb-6">
            This application allows users to capture screenshots of their browser tabs.
            The screenshots are stored and can be viewed in the admin dashboard.
          </p>
          
          <div className="flex justify-center">
            <Link href="/admin" className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors">
                Go to Admin Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 