import { AppLayout } from '@/components/layout';

export default function MentorliteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <AppLayout>{children}</AppLayout>
  );
}
