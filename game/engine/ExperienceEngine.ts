
export type ExperienceReward = {
  enemyId: string;
  enemyName: string;
  experience: number;
};

export const EXPERIENCE_REWARDS: Record<
  string,
  ExperienceReward
> = {
  "goblin-warrior-01": {
    enemyId: "goblin-warrior-01",
    enemyName: "Goblin Warrior",
    experience: 50,
  },
};

export function getExperienceReward(
  enemyId: string
): number {
  return EXPERIENCE_REWARDS[enemyId]?.experience ?? 0;
}
