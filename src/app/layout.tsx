import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthButton } from "@/components/AuthButton";
import { Navigation } from "@/components/Navigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Siêu Thị Giấy - Packaging Store",
  description: "Website bán giấy tấm đóng gói 3 lớp và 5 lớp cho doanh nghiệp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900">
        <div className="mx-auto flex min-h-full max-w-7xl flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm">
            <div className="px-6 py-5">
              <div className="mb-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">SG</span>
                  <div className="leading-tight">
                    <p className="text-base font-semibold text-slate-900">Siêu Thị Giấy</p>
                    <p className="text-xs text-slate-500">Cửa Hàng Giấy Tấm Online</p>
                  </div>
                </Link>
                <div className="flex items-center gap-6">
                  <AuthButton />
                  <div className="text-right text-sm text-slate-600">0.00đ <span className="text-xs">0 mục</span></div>
                </div>
              </div>
              <Navigation />
            </div>
          </header>

          <main className="flex-1 px-6 py-8">{children}</main>

          <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-600">
            © Siêu Thị Giấy 2026
          </footer>
        </div>
      </body>
    </html>
  );
}
