import { Poppins } from "next/font/google";
import "./globals.css";
import "react-image-crop/dist/ReactCrop.css";
import { ThemeProvider } from "@/components/common/theme-provider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400","500","600","700"],
  variable: "--font-sans"
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
