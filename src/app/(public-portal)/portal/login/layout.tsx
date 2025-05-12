import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Client Login - TimeBill Pro',
  description: 'Login to your client portal.',
};

export default function PublicPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
        {children}
    </>
  );
}
