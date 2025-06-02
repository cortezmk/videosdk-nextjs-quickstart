"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Home() {
  const [sessionName, setSessionName] = useState("");
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <Input
        type="text"
        className="w-full max-w-xs"
        placeholder="Your nick"
        value={sessionName}
        onChange={(e) => setSessionName(e.target.value)}
      />
      <Button
        className="w-full max-w-xs mt-8"
        disabled={!sessionName}
        onClick={() => router.push(`/call/${sessionName}`)}
      >
        Join
      </Button>
    </main>
  );
}
