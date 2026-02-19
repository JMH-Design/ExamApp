"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasCompletedOnboarding } from "@/lib/storage";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (hasCompletedOnboarding()) {
      router.replace("/home");
    } else {
      router.replace("/onboarding/school");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-foreground/70 font-body">
        Loading…
      </div>
    </div>
  );
}
