import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kiddos Bookys",
  description: "Made-up bilingual storybooks, read aloud in English and Spanish.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#ffb703",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fredoka.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
