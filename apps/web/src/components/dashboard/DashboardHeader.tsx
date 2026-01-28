'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface DashboardHeaderProps {
  user: {
    name: string;
    email: string;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="bg-white/5 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-2xl font-bold">
          Game<span className="text-brand-pink">Blitz</span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-white/60 hidden sm:block">{user.name}</span>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-secondary text-sm">
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
