// src/app/not-found.tsx
export const runtime = 'edge';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
      <p className="mt-4">Sorry, we couldn&apos;t find the page you were looking for.</p>
    </div>
  );
}
