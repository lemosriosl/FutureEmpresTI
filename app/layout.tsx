import type { Metadata } from 'next';
import { connection } from 'next/server';
import { AppProviders } from '@/lib/trpc';
import './globals.css';

export const metadata: Metadata = {
  title: 'EmpresTI',
  description: 'Catálogo interno de empréstimo de equipamentos',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return (
    <html lang="pt-BR">
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
