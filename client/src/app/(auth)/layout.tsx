
import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {children}
    </main>
  );
}
