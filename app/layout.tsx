import ReduxProvider from "@/store/ReduxProvider";
import { Inter } from "next/font/google";
import type React from "react";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          {children}
          <Toaster
            position="top-right"
            gutter={12}
            containerStyle={{
              top: 20,
              right: 20,
            }}
            toastOptions={{
              duration: 5000,
              className: "backdrop-blur-md",
              style: {
                background: "rgba(255, 255, 255, 0.95)",
                color: "#0f172a",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: "12px",
                boxShadow:
                  "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1)",
                backdropFilter: "blur(16px)",
                fontSize: "14px",
                fontWeight: "500",
                padding: "16px 20px",
                minWidth: "320px",
                maxWidth: "420px",
              },
              success: {
                iconTheme: {
                  primary: "#059669",
                  secondary: "#ffffff",
                },
                style: {
                  background:
                    "linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)",
                  color: "#064e3b",
                  border: "1px solid rgba(5, 150, 105, 0.2)",
                  boxShadow:
                    "0 25px 50px -12px rgba(5, 150, 105, 0.15), 0 10px 20px -5px rgba(5, 150, 105, 0.1)",
                },
              },
              error: {
                iconTheme: {
                  primary: "#dc2626",
                  secondary: "#ffffff",
                },
                style: {
                  background:
                    "linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%)",
                  color: "#7f1d1d",
                  border: "1px solid rgba(220, 38, 38, 0.2)",
                  boxShadow:
                    "0 25px 50px -12px rgba(220, 38, 38, 0.15), 0 10px 20px -5px rgba(220, 38, 38, 0.1)",
                },
              },
              loading: {
                iconTheme: {
                  primary: "#3b82f6",
                  secondary: "#ffffff",
                },
                style: {
                  background:
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(96, 165, 250, 0.04) 100%)",
                  color: "#1e3a8a",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                  boxShadow:
                    "0 25px 50px -12px rgba(59, 130, 246, 0.15), 0 10px 20px -5px rgba(59, 130, 246, 0.1)",
                },
              },
            }}
          />
        </ReduxProvider>
      </body>
    </html>
  );
}
