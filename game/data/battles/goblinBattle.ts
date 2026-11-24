
export type BattlePassage = {
  id: string;
  title: string;
  description: string;
  text: string;
  difficulty: "easy" | "medium" | "hard";
};

export const goblinBattlePassages = {
  "protect-village": [
    {
      id: "defensive-stance",
      title: "Defensive Stance",
      description: "Prepare yourself to protect the village.",
      difficulty: "easy",
      text: "You raise your shield and stand firmly between the goblin and the helpless villagers.",
    },
    {
      id: "shield-block",
      title: "Shield Block",
      description: "Block the goblin's incoming attack.",
      difficulty: "easy",
      text: "The goblin swings its rusty blade, but you lift your shield and block the attack with a loud clash of metal.",
    },
    {
      id: "counter-strike",
      title: "Counter Strike",
      description: "Attack after defending yourself.",
      difficulty: "medium",
      text: "The goblin loses its balance after striking your shield. You seize the opportunity and deliver a powerful counterattack.",
    },
    {
      id: "protect-the-innocent",
      title: "Protect the Innocent",
      description: "Stand your ground against the enemy.",
      difficulty: "medium",
      text: "You refuse to retreat while innocent villagers remain behind you. Gathering your courage, you push the goblin away from the village gates.",
    },
    {
      id: "guardian-resolve",
      title: "Guardian's Resolve",
      description: "Fight with the strength of your determination.",
      difficulty: "hard",
      text: "Remembering the frightened faces of the villagers, you tighten your grip and charge forward with unwavering determination.",
    },
    {
      id: "village-defender",
      title: "Village Defender",
      description: "Deliver the final strike.",
      difficulty: "hard",
      text: "You plant your feet firmly, raise your weapon, and unleash your strongest attack to protect the people of Eldoria.",
    },
  ],

  "investigate-forest": [
    {
      id: "hidden-weakness",
      title: "Hidden Weakness",
      description: "Study the enemy before attacking.",
      difficulty: "easy",
      text: "You observe the goblin carefully and notice that its left side is poorly protected beneath its worn armor.",
    },
    {
      id: "forest-ambush",
      title: "Forest Ambush",
      description: "Strike from an unexpected direction.",
      difficulty: "medium",
      text: "Using the thick forest shadows, you circle behind the goblin and prepare a surprise attack against its unguarded back.",
    },
    {
      id: "ancient-trap",
      title: "Ancient Trap",
      description: "Use the forest terrain to your advantage.",
      difficulty: "medium",
      text: "You notice an old hunting trap hidden beneath fallen leaves and carefully lure the goblin toward its concealed mechanism.",
    },
    {
      id: "shadow-strike",
      title: "Shadow Strike",
      description: "Exploit the enemy's blind spot.",
      difficulty: "hard",
      text: "The goblin searches the trees for your position, unaware that you have already moved behind it and discovered the perfect opening.",
    },
    {
      id: "hunter-finish",
      title: "Hunter's Finish",
      description: "End the encounter with a precise attack.",
      difficulty: "hard",
      text: "You focus on the goblin's exposed weakness, calculate its next movement, and unleash a precise strike before it can defend itself.",
    },
  ],
} satisfies Record<"protect-village" | "investigate-forest", BattlePassage[]>;
