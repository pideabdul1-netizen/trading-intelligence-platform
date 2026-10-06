import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/PwaControls";

export const metadata = {
  title: "Trading Intelligence Platform",
  applicationName: "Trading Intel",
  description: "Real-time forex and crypto market intelligence dashboard"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020617"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
