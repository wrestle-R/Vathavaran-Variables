import type { Metadata } from "next";
import { Header, Footer } from "@/components/chrome";
import "./globals.css";
import "./landing.css";
export const metadata: Metadata = {
  title: {
    default: "Vathavaran — Your environment, in sync",
    template: "%s · Vathavaran",
  },
  description:
    "Encrypted environment files for your GitHub repositories. One workspace across your terminal, browser, and phone.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{document.documentElement.dataset.theme=localStorage.getItem('varte-theme')||'dark'}catch{}",
          }}
        />
        <a href="#main" className="skip">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
