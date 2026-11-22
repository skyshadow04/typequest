
import type { CharacterClass } from "@/game/types/character";

export type ClassSkill = {
  id: string;
  name: string;
  description: string;
  className: CharacterClass;
};

export type ActiveSkillState = {
  ironGuard: boolean;
  arcaneSurge: boolean;
};

export const CLASS_SKILLS: Record<CharacterClass, ClassSkill> = {
  warrior: {
    id: "iron-guard",
    name: "Iron Guard",
    description: "Reduces the next incoming enemy attack by 50%.",
    className: "warrior",
  },

  mage: {
    id: "arcane-surge",
    name: "Arcane Surge",
    description: "Increases your next successful attack damage by 50%.",
    className: "mage",
  },

  archer: {
    id: "precision-shot",
    name: "Precision Shot",
    description: "Adds 30% damage when typing accuracy is at least 95%.",
    className: "archer",
  },
};

export const INITIAL_ACTIVE_SKILLS: ActiveSkillState = {
  ironGuard: false,
  arcaneSurge: false,
};

export function getClassSkill(
  characterClass: CharacterClass
): ClassSkill {
  return CLASS_SKILLS[characterClass];
}

export function activateClassSkill(
  characterClass: CharacterClass,
  activeSkills: ActiveSkillState
): ActiveSkillState {
  if (characterClass === "warrior") {
    return {
      ...activeSkills,
      ironGuard: true,
    };
  }

  if (characterClass === "mage") {
    return {
      ...activeSkills,
      arcaneSurge: true,
    };
  }

  return activeSkills;
}

export function calculateSkillDamage(
  characterClass: CharacterClass,
  damage: number,
  accuracy: number,
  activeSkills: ActiveSkillState
): number {
  if (
    characterClass === "mage" &&
    activeSkills.arcaneSurge
  ) {
    return Math.round(damage * 1.5);
  }

  if (
    characterClass === "archer" &&
    accuracy >= 95
  ) {
    return Math.round(damage * 1.3);
  }

  return damage;
}

export function calculateSkillDefense(
  incomingDamage: number,
  activeSkills: ActiveSkillState
): number {
  if (!activeSkills.ironGuard) {
    return incomingDamage;
  }

  return Math.ceil(incomingDamage * 0.5);
}
