import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PMO Master Web App',
  description: 'Mobile first AI powered project management application.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
            {children}
          </main>
          <Toaster position="bottom-center" />
          <FeedbackWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
