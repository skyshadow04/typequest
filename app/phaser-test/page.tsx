
"use client";

import dynamic from "next/dynamic";

const PhaserGame = dynamic(
  () => import("@/game/scenes/PhaserGame"),
  { ssr: false }
);

export default function PhaserTestPage() {
  return (
    <main className="min-h-screen bg-[#100f19] p-6 text-white">
      <h1 className="mb-6 text-3xl font-black text-amber-400">
        TYPEQUEST - PHASER TEST
      </h1>

      <PhaserGame />
    </main>
  );
}
