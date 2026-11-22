
export type CharacterClass = "warrior" | "mage" | "archer";

export type PlayerCharacter = {
  id: string;
  name: string;
  characterClass: CharacterClass;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  maxHp: number;
  currentHp: number;
  baseAttack: number;
  baseDefense: number;
};

export const INITIAL_CHARACTER: PlayerCharacter = {
  id: "player-001",
  name: "Adventurer",
  characterClass: "warrior",
  level: 1,
  experience: 0,
  experienceToNextLevel: 100,
  maxHp: 100,
  currentHp: 100,
  baseAttack: 20,
  baseDefense: 0,
};
