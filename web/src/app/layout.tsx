import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ChatProvider } from "@/lib/chat";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "MediBook - Doctor Appointment Platform",
    description: "Book appointments with top doctors using our AI-powered voice assistant",
    keywords: ["doctor", "appointment", "healthcare", "booking", "voice assistant"],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    <ChatProvider>
                        {children}
                    </ChatProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
