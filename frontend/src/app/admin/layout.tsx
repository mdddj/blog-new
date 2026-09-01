import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { AdminLayout as AdminLayoutWrapper } from "@/components/admin";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
      <Toaster />
    </AuthProvider>
  );
}
