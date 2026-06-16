import type { Metadata } from "next";
import "./global.css";

export const metadata: Metadata = {
  title: "Encuesta Central",
  description: "Volunteer scheduling for our church community",
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