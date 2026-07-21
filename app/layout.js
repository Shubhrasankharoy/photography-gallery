import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { StudioProvider } from "@/context/StudioContext";
import { SearchProvider } from "@/context/SearchContext";
import GlobalSearch from "@/components/GlobalSearch";
import AuthLoadingWrapper from "@/components/AuthLoadingWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CaptureSpace | Premium Client Galleries & AI Search",
  description: "A state-of-the-art platform for professional photographers to host beautiful client galleries, download high-res portfolios, and match faces instantly.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('theme');
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const theme = savedTheme || systemTheme;
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:text-zinc-50 transition-colors duration-300">
        <AuthProvider>
          <StudioProvider>
            <SearchProvider>
              <AuthLoadingWrapper>
                <Navbar />
                <main className="grow flex flex-col">{children}</main>
                <Footer />
                <GlobalSearch />
              </AuthLoadingWrapper>
            </SearchProvider>
          </StudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

