"use client";

import { usePathname, useRouter } from "next/navigation";

export function LogoutButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  async function handleClick() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      className="fixed right-4 top-4 z-50 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-100"
    >
      Cerrar sesión
    </button>
  );
}
