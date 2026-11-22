
import type { TypingResult } from "./CombatEngine";

import {
  calculateDamage,
  applyDamage,
  applyEnemyDamage,
  isEnemyDefeated,
  isPlayerDefeated,
} from "./CombatEngine";

import type { PlayerInventory } from "@/game/types/inventory";
import type { PlayerCharacter } from "@/game/types/character";

export type BattleStatus =
  | "player-turn"
  | "enemy-turn"
  | "victory"
  | "defeat";

export type BattleState = {
  playerHp: number;
  enemyHp: number;
  playerMaxHp: number;
  enemyMaxHp: number;
  status: BattleStatus;
  lastPlayerDamage: number;
  lastEnemyDamage: number;
  message: string;
};

export const INITIAL_BATTLE_STATE: BattleState = {
  playerHp: 100,
  enemyHp: 100,
  playerMaxHp: 100,
  enemyMaxHp: 100,
  status: "player-turn",
  lastPlayerDamage: 0,
  lastEnemyDamage: 0,
  message: "The Goblin Warrior approaches!",
};

const PLAYER_BASE_ATTACK = 20;
const PLAYER_BASE_DEFENSE = 0;
const ENEMY_ATTACK = 10;

type CharacterCombatStats = Pick<
  PlayerCharacter,
  "baseAttack" | "baseDefense"
>;

function getEquipmentBonuses(inventory?: PlayerInventory) {
  const equippedItems =
    inventory?.items.filter((item) => item.equipped) ?? [];

  const attackBonus = equippedItems
    .filter((item) => item.type === "weapon")
    .reduce((total, item) => {
      if (item.id === "forest-blade") return total + 5;
      return total;
    }, 0);

  const defenseBonus = equippedItems
    .filter((item) => item.type === "armor")
    .reduce((total, item) => {
      if (item.id === "guardian-shield") return total + 3;
      return total;
    }, 0);

  return { attackBonus, defenseBonus };
}

export function resolvePlayerTurn(
  state: BattleState,
  typingResult: TypingResult,
  inventory?: PlayerInventory,
  character?: CharacterCombatStats
): BattleState {
  if (state.status !== "player-turn") return state;

  const { attackBonus, defenseBonus } = getEquipmentBonuses(inventory);

  const effectiveAttack =
    (character?.baseAttack ?? PLAYER_BASE_ATTACK) + attackBonus;

  const effectiveDefense =
    (character?.baseDefense ?? PLAYER_BASE_DEFENSE) + defenseBonus;

  const attack = calculateDamage(typingResult, effectiveAttack);
  const newEnemyHp = applyDamage(state.enemyHp, attack.damage);

  if (isEnemyDefeated(newEnemyHp)) {
    return {
      ...state,
      enemyHp: newEnemyHp,
      status: "victory",
      lastPlayerDamage: attack.damage,
      lastEnemyDamage: 0,
      message: `Victory! You dealt ${attack.damage} damage to the Goblin Warrior!`,
    };
  }

  const effectiveEnemyAttack = Math.max(
    0,
    ENEMY_ATTACK - effectiveDefense
  );

  const newPlayerHp = applyEnemyDamage(
    state.playerHp,
    effectiveEnemyAttack
  );

  if (isPlayerDefeated(newPlayerHp)) {
    return {
      ...state,
      playerHp: newPlayerHp,
      enemyHp: newEnemyHp,
      status: "defeat",
      lastPlayerDamage: attack.damage,
      lastEnemyDamage: effectiveEnemyAttack,
      message: "You have been defeated by the Goblin Warrior!",
    };
  }

  return {
    ...state,
    playerHp: newPlayerHp,
    enemyHp: newEnemyHp,
    status: "player-turn",
    lastPlayerDamage: attack.damage,
    lastEnemyDamage: effectiveEnemyAttack,
    message: `You dealt ${attack.damage} damage! The Goblin retaliated for ${effectiveEnemyAttack} damage!`,
  };
}

export function resolveFailedAttack(
  state: BattleState,
  inventory?: PlayerInventory,
  character?: CharacterCombatStats
): BattleState {
  if (state.status !== "player-turn") return state;

  const { defenseBonus } = getEquipmentBonuses(inventory);

  const effectiveDefense =
    (character?.baseDefense ?? PLAYER_BASE_DEFENSE) + defenseBonus;

  const effectiveEnemyAttack = Math.max(
    0,
    ENEMY_ATTACK - effectiveDefense
  );

  const newPlayerHp = applyEnemyDamage(
    state.playerHp,
    effectiveEnemyAttack
  );

  if (isPlayerDefeated(newPlayerHp)) {
    return {
      ...state,
      playerHp: newPlayerHp,
      lastPlayerDamage: 0,
      lastEnemyDamage: effectiveEnemyAttack,
      status: "defeat",
      message: "Your attack failed! The Goblin defeated you!",
    };
  }

  return {
    ...state,
    playerHp: newPlayerHp,
    lastPlayerDamage: 0,
    lastEnemyDamage: effectiveEnemyAttack,
    message: `Your attack failed! The Goblin retaliated for ${effectiveEnemyAttack} damage!`,
  };
}
