'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Upload, ListVideo, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Publish', href: '/dashboard/publish', icon: Upload },
  { label: 'Jobs', href: '/dashboard/jobs', icon: ListVideo },
  { label: 'Accounts', href: '/dashboard/accounts', icon: Link2 },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#0a0a1a]/95 backdrop-blur-xl">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[60px]',
                isActive
                  ? 'text-indigo-400'
                  : 'text-slate-500 active:text-slate-300'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 transition-all',
                  isActive && 'drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]'
                )}
              />
              <span className={cn(
                'text-[10px] font-medium',
                isActive && 'text-indigo-400'
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 rounded-full bg-indigo-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
