// components/ProtectedRoute.tsx
"use client";
import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element, allowedRoles: string[] }) {
  const { role, loading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!role || !allowedRoles.includes(role))) {
      router.replace("/unauthorized");
    }
  }, [role, loading]);

  if (loading || !role) return <div>Loading...</div>;
  return children;
}
