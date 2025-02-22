import type { Metadata } from "next";
import "../assets/scss/style.scss";
// import Header from "@/components/Header-old";
import Script from "next/script";
import Head from "next/head";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Suspense } from "react";
import "@/styles/globals.scss";
import { Open_Sans } from 'next/font/google';
import localFont from "next/font/local";

const openSans = Open_Sans({
  subsets: ['latin', "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-open-sans",
});

const gropled = localFont({
  src: [
    {
      path: "../../public/fonts/Gropled/Gropled-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-gropled",
});

export const metadata: Metadata = {
  title: "Scan your docs",
  description: "Scan your docs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${openSans.variable} ${gropled.variable}`}>
      <body>
        <GoogleOAuthProvider clientId="195463120030-60ebjae1ek2bjav8jas007gbqsmfha7k.apps.googleusercontent.com">
          {/* <Header /> */}
          <Head>
            <script
              src="https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-with-polyfills-latest.js"
              async
            />
          </Head>
          <Head>
            <script
              src="https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-token-with-polyfills-latest.js"
              async
            />
          </Head>
        </GoogleOAuthProvider>
        {children}
      </body>
    </html>
  );
}
