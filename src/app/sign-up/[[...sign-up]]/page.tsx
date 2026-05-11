"use client";

import { SignUp } from "@clerk/nextjs";
import AuthLayout from "@/components/AuthLayout";
import { clerkAppearance } from "@/components/clerkAppearance";

export default function SignUpPage() {
  return (
    <AuthLayout
      headline={
        <>
          Your art.{" "}
          <span className="text-gradient">Every table.</span>
        </>
      }
      sub="Artists upload. Venues transform. Royalties flow. Join the platform redefining dining entertainment."
    >
      <SignUp appearance={clerkAppearance} forceRedirectUrl="/dashboard" />
    </AuthLayout>
  );
}
