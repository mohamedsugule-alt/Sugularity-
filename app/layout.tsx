import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { OnboardingProvider } from '@/components/providers/OnboardingProvider';
import { OnboardingBanner } from '@/components/layout/OnboardingBanner';
import { CommandMenu } from '@/components/ui/command-menu';
import { TaliyeChat } from '@/components/ai/TaliyeChat';
import { GlobalInbox } from '@/components/inbox/GlobalInbox';
import { FocusProvider } from '@/components/providers/FocusProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Sugularity | Local LifeOS',
  description: 'Hands-on Life Operating System',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#8B5CF6" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased h-screen overflow-hidden`} suppressHydrationWarning>
        <ThemeProvider>
          <FocusProvider>
            <OnboardingProvider>
              {children}
              <CommandMenu />
              <GlobalInbox />
              <OnboardingBanner />
              <TaliyeChat />
            </OnboardingProvider>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                },
              }}
            />
          </FocusProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
