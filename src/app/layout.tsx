import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'YTKids Studio — AI Kids Video Creation Platform',
  description: 'Produce high-retention AI children stories, educational shorts, and animated nursery rhymes with character consistency and automated YouTube publishing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <Header />
        <main style={{
          marginLeft: '260px',
          marginTop: '70px',
          minHeight: 'calc(100vh - 70px)',
          padding: '32px',
          maxWidth: '1400px',
        }}>
          {children}
        </main>
      </body>
    </html>
  );
}
