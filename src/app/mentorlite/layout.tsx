import { AppLayout } from '@/components/layout';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function MentorliteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <FirebaseClientProvider>
      <AppLayout>{children}</AppLayout>
    </FirebaseClientProvider>
  );
}
