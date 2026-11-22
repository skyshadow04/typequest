
import type { PlayerCharacter } from "@/game/types/character";

export function addExperience(
  character: PlayerCharacter,
  amount: number
): PlayerCharacter {
  if (amount <= 0) return character;

  let updatedCharacter = {
    ...character,
    experience: character.experience + amount,
  };

  while (
    updatedCharacter.experience >=
    updatedCharacter.experienceToNextLevel
  ) {
    updatedCharacter = {
      ...updatedCharacter,
      level: updatedCharacter.level + 1,
      experience:
        updatedCharacter.experience -
        updatedCharacter.experienceToNextLevel,
      experienceToNextLevel: Math.floor(
        updatedCharacter.experienceToNextLevel * 1.5
      ),
      maxHp: updatedCharacter.maxHp + 20,
      currentHp: updatedCharacter.maxHp + 20,
      baseAttack: updatedCharacter.baseAttack + 5,
      baseDefense: updatedCharacter.baseDefense + 2,
    };
  }

  return updatedCharacter;
}

export function getExperienceProgress(
  character: PlayerCharacter
): number {
  return Math.min(
    100,
    (character.experience /
      character.experienceToNextLevel) *
      100
  );
}
