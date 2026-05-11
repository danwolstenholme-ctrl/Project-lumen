"use client";

import { SignIn } from "@clerk/nextjs";
import AuthLayout from "@/components/AuthLayout";
import { clerkAppearance } from "@/components/clerkAppearance";

export default function SignInPage() {
  return (
    <AuthLayout
      headline={
        <>
          Welcome <span className="text-gradient">back.</span>
        </>
      }
      sub="Your stage awaits. Sign in to access your shows, venues, and licensing dashboard."
    >
      <SignIn appearance={clerkAppearance} />
    </AuthLayout>
  );
}
