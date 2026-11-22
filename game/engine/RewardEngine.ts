
export type StoryChoice =
  | "protect-village"
  | "investigate-forest";

export type BattleReward = {
  id: string;
  name: string;
  description: string;
  type: "defense" | "attack";
  value: number;
};

export const STORY_REWARDS: Record<StoryChoice, BattleReward> = {
  "protect-village": {
    id: "guardian-shield",
    name: "Guardian Shield",
    description: "Reduces incoming enemy damage by 3 HP.",
    type: "defense",
    value: 3,
  },

  "investigate-forest": {
    id: "forest-blade",
    name: "Forest Blade",
    description: "Increases your base attack by 5.",
    type: "attack",
    value: 5,
  },
};

export function getStoryReward(
  storyChoice: StoryChoice
): BattleReward {
  return STORY_REWARDS[storyChoice];
}

export function applyRewardToAttack(
  baseAttack: number,
  reward: BattleReward
): number {
  if (reward.type !== "attack") {
    return baseAttack;
  }

  return baseAttack + reward.value;
}

export function applyRewardToDefense(
  incomingDamage: number,
  reward: BattleReward
): number {
  if (reward.type !== "defense") {
    return incomingDamage;
  }

  return Math.max(0, incomingDamage - reward.value);
}
