
import type { CharacterClass, PlayerCharacter } from "@/game/types/character";

export const CHARACTER_CLASSES: Record<
  CharacterClass,
  Pick<PlayerCharacter, "maxHp" | "baseAttack" | "baseDefense">
> = {
  warrior: {
    maxHp: 120,
    baseAttack: 20,
    baseDefense: 5,
  },
  mage: {
    maxHp: 80,
    baseAttack: 30,
    baseDefense: 0,
  },
  archer: {
    maxHp: 100,
    baseAttack: 25,
    baseDefense: 2,
  },
};

export function createCharacter(
  name: string,
  characterClass: CharacterClass
): PlayerCharacter {
  const stats = CHARACTER_CLASSES[characterClass];

  return {
    id: crypto.randomUUID(),
    name: name.trim() || "Adventurer",
    characterClass,
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    maxHp: stats.maxHp,
    currentHp: stats.maxHp,
    baseAttack: stats.baseAttack,
    baseDefense: stats.baseDefense,
  };
}
