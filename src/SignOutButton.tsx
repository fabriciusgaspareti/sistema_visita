"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      className="px-4 py-2 rounded-lg transition-colors bg-[#175C7D] hover:bg-[#124B66] text-white"
      onClick={() => void signOut()}
    >
      Sair
    </button>
  );
}