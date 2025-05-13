import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans'; // Corrected import from geist/font/sans
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Added Toaster

const geistSans = GeistSans({ // Corrected usage for GeistSans
  variable: '--font-geist-sans',
  // subsets: ['latin'], // 'subsets' is not a valid option for GeistSans from 'geist/font/sans'. GeistSans defaults to Latin.
});

// If GeistMono were to be used, it should be imported from 'geist/font/mono'
// import { GeistMono } from 'geist/font/mono';
// const geistMono = GeistMono({
//   variable: '--font-geist-mono',
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
