import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HPLC Report Generator",
  description: "Professional HPLC report generation with .LCM file export for LabSolutions compatibility",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
