import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cab Hiring App",
  description: "Sprint 1 Web App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
