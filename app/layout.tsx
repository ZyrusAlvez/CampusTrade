import "../style/globals.css";
import React, { ReactNode } from "react";
import { Toaster } from 'sonner';

type Props = {
  children: ReactNode;
};

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      
      <body className="flex flex-col font-roboto bg-gray-900" suppressHydrationWarning>
          {children}
          <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}