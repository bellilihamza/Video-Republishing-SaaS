import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import AuthProvider from '@/components/auth/AuthProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'RePublish — Auto-Republish Videos to YouTube',
  description:
    'Automatically republish short videos from TikTok, Instagram, and Facebook to YouTube. Fast, easy, and production-ready.',
  keywords: ['video', 'republish', 'youtube', 'tiktok', 'instagram', 'shorts'],
  openGraph: {
    title: 'RePublish — Auto-Republish Videos to YouTube',
    description:
      'Paste a video URL. We download, process, and upload it to YouTube automatically.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#0a0a1a] text-slate-100 antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(20, 20, 50, 0.95)',
                color: '#f1f5f9',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '12px',
                backdropFilter: 'blur(12px)',
                fontSize: '14px',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
