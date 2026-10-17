import type { Metadata } from "next";

import { AppShell } from "@/app/components/app-shell";
import { CurrentUserProvider } from "@/app/context/current-user-context";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Document Repository",
    template: "%s | Document Repository",
  },
  description: "A permission-aware document repository proof of concept.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <CurrentUserProvider>
          <AppShell>{children}</AppShell>
        </CurrentUserProvider>
      </body>
    </html>
  );
}
