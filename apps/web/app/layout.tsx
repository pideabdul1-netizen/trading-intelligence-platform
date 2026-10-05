import "./globals.css";

export const metadata = {
  title: "Trading Intelligence Platform",
  description: "Real-time forex and crypto market intelligence dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
