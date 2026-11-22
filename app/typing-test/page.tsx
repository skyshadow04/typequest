
"use client";

import { useState } from "react";
import TypingEngine, {
  type TypingResult,
} from "@/game/components/TypingEngine";

export default function TypingTestPage() {
  const [result, setResult] = useState<TypingResult | null>(null);

  return (
    <main className="min-h-screen bg-[#100f19] text-white p-6">
      <div className="max-w-4xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-3">
          TypeQuest – Typing Engine Test
        </h1>

        <p className="text-gray-400 mb-8">
          Test your typing skills before entering battle.
        </p>

        <TypingEngine
          onComplete={(typingResult) => {
            setResult(typingResult);
          }}
        />

        {result && (
          <div className="mt-6 p-5 rounded-xl border border-green-500/30 bg-green-500/10">
            <h2 className="font-bold text-green-400 mb-3">
              Combat Data Received!
            </h2>

            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
