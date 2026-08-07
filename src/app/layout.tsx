import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Codex Experiment Gallery",
  description: "Ten inspectable AI developer workflows: diagnosis, transformation, review, generation, tools, and vision.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
