import { AuthProvider } from "@/components/auth-provider";
import { AdminLayout as AdminLayoutWrapper } from "@/components/admin";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
        </AuthProvider>
    );
}
