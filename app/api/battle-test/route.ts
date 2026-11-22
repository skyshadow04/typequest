
import { NextResponse } from "next/server";

import {
  INITIAL_BATTLE_STATE,
  resolvePlayerTurn,
  resolveFailedAttack,
} from "@/game/engine/BattleEngine";

export async function GET() {
  const typingResult = {
    wpm: 40,
    accuracy: 95,
    errors: 2,
    rank: "A" as const,
  };

  const successfulBattle = resolvePlayerTurn(
    INITIAL_BATTLE_STATE,
    typingResult
  );

  const failedBattle = resolveFailedAttack(
    INITIAL_BATTLE_STATE
  );

  return NextResponse.json({
    successfulAttack: successfulBattle,
    failedAttack: failedBattle,
  });
}
