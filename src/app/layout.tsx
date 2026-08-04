import type { Metadata } from 'next';
import ThemeRegistry from '@/components/theme/ThemeRegistry';
import './globals.css';

export const metadata: Metadata = {
  title: 'ASF IMS - Airports Security Force Inventory Management System (Light MUI)',
  description: 'Enterprise Logistics, Demand Entitlement, HQ Consolidation & Central Distribution System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
