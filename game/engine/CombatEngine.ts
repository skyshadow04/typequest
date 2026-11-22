
export type TypingResult = {
  wpm: number;
  accuracy: number;
  errors: number;
  rank: "S" | "A" | "B" | "C" | "D";
};

export type CombatStats = {
  baseAttack: number;
  maxHp: number;
  currentHp: number;
};

export type DamageResult = {
  damage: number;
  baseAttack: number;
  wpmMultiplier: number;
  accuracyMultiplier: number;
  rank: TypingResult["rank"];
};

// Calculate player attack damage
export function calculateDamage(
  typingResult: TypingResult,
  baseAttack: number
): DamageResult {
  const wpmMultiplier = Math.min(
    Math.max(typingResult.wpm, 0) / 40,
    2
  );

  const accuracyMultiplier = Math.min(
    Math.max(typingResult.accuracy, 0),
    100
  ) / 100;

  const rawDamage =
    baseAttack * wpmMultiplier * accuracyMultiplier;

  return {
    damage: Math.max(0, Math.round(rawDamage)),
    baseAttack,
    wpmMultiplier,
    accuracyMultiplier,
    rank: typingResult.rank,
  };
}

// Apply damage to an enemy
export function applyDamage(
  currentHp: number,
  damage: number
): number {
  return Math.max(0, currentHp - damage);
}

// Apply enemy damage to player
export function applyEnemyDamage(
  currentHp: number,
  enemyAttack: number
): number {
  return Math.max(0, currentHp - enemyAttack);
}

// Check whether an enemy has been defeated
export function isEnemyDefeated(currentHp: number): boolean {
  return currentHp <= 0;
}

// Check whether the player has been defeated
export function isPlayerDefeated(currentHp: number): boolean {
  return currentHp <= 0;
}
