import { NextResponse } from "next/server";

import {
  calculateDamage,
  applyDamage,
  applyEnemyDamage,
  isEnemyDefeated,
  isPlayerDefeated,
} from "@/game/engine/CombatEngine";

export async function GET() {
  const typingResult = {
    wpm: 40,
    accuracy: 95,
    errors: 2,
    rank: "A" as const,
  };

  const attack = calculateDamage(typingResult, 20);

  const enemyHp = applyDamage(100, attack.damage);
  const playerHp = applyEnemyDamage(100, 10);

  return NextResponse.json({
    attack,
    enemyHp,
    enemyDefeated: isEnemyDefeated(enemyHp),
    playerHp,
    playerDefeated: isPlayerDefeated(playerHp),
  });
}