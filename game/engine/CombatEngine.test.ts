
import {
  calculateDamage,
  applyDamage,
  applyEnemyDamage,
  isEnemyDefeated,
  isPlayerDefeated,
} from "./CombatEngine";

const typingResult = {
  wpm: 40,
  accuracy: 95,
  errors: 2,
  rank: "A" as const,
};

const attack = calculateDamage(typingResult, 20);

console.log("Attack Result:", attack);

const enemyHp = applyDamage(100, attack.damage);

console.log("Enemy HP:", enemyHp);
console.log("Enemy Defeated:", isEnemyDefeated(enemyHp));

const playerHp = applyEnemyDamage(100, 10);

console.log("Player HP:", playerHp);
console.log("Player Defeated:", isPlayerDefeated(playerHp));
