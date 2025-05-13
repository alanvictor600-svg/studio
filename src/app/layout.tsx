import type {Metadata} from 'next';
import { Geist_Sans } from 'next/font/google'; // Corrected import
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Added Toaster

const geistSans = Geist_Sans({ // Corrected usage
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// Geist_Mono is not explicitly used, can be removed if not needed for specific mono sections
// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

export const metadata: Metadata = {
  title: 'Bolão Potiguar',
  description: 'Sua sorte começa aqui!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
