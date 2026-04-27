
import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'VeiLConnect | VeiLConfeSsions',
  description: 'Professional confession management and intelligence platform.',
  icons: {
    icon: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Logo-ai-veil.png',
    shortcut: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Logo-ai-veil.png',
    apple: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Logo-ai-veil.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet" />
        <link rel="icon" href="https://upload.wikimedia.org/wikipedia/commons/2/2c/Logo-ai-veil.png" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
