import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'MentorIA Academy Lite',
  description: 'Estude com estratégia e inteligência',
  openGraph: {
    title: 'MentorIA Lite | MentorIA Academy',
    description: 'Estude com estratégia e inteligência.',
    url: 'https://my-web-app--studio-6116545318-c4cd8.us-central1.hosted.app/',
    siteName: 'MentorIA Academy',
    images: [
      {
        url: 'https://my-web-app--studio-6116545318-c4cd8.us-central1.hosted.app/LOGO/logotipo%20site.png',
        width: 1200,
        height: 630,
        alt: 'MentorIA Academy Logo',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
