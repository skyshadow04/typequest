
import type { StoryChapter } from "@/game/types/story";

export const chapter1: StoryChapter = {
  id: "chapter-1",
  title: "The Awakening",
  initialNodeId: "opening",
  
  nodes: {
    opening: {
      id: "opening",
      type: "narrative",
      title: "The Shattered Crystal",
      paragraphs: [
        "Long ago, beyond the mountains of Eldoria, there existed a kingdom protected by an ancient crystal.",
        "For centuries, peace prevailed. But one night, the crystal shattered, and darkness began to consume the land.",
        "The skies turned crimson. Strange creatures emerged from the forests, and the kingdom fell into chaos.",
        "You are a young adventurer living in the peaceful village of Eldoria. Tonight, your destiny is about to change."
      ],
      nextNodeId: "village-choice"
    },

    "village-choice": {
      id: "village-choice",
      type: "choice",
      title: "A Cry for Help",
      paragraphs: [
        "A wounded village guard approaches you.",
        "\"Please... you must help us. Something terrible has awakened in the forest. The villagers are in danger!\""
      ],
      choices: [
        {
          id: "protect-village",
          label: "Protect the Villagers",
          description:
            "Help defend the village and earn the guard's trust.",
          nextNodeId: "protect-scene",
          decisionKey: "first-choice",
          decisionValue: "protect-village"
        },
        {
          id: "investigate-forest",
          label: "Investigate the Forest",
          description:
            "Search for the source of the mysterious creatures.",
          nextNodeId: "forest-scene",
          decisionKey: "first-choice",
          decisionValue: "investigate-forest"
        }
      ]
    },

    "protect-scene": {
      id: "protect-scene",
      type: "narrative",
      title: "Defenders of Eldoria",
      paragraphs: [
        "You draw your weapon and stand beside the village guards.",
        "The villagers retreat behind the stone walls while you prepare to defend their homes.",
        "A group of goblins emerges from the darkness. The first battle of your journey begins!"
      ],
      nextNodeId: "goblin-encounter"
    },

    "forest-scene": {
      id: "forest-scene",
      type: "narrative",
      title: "Into the Whispering Forest",
      paragraphs: [
        "Ignoring the guard's warning, you enter the forest.",
        "The trees whisper strange words as an unnatural wind passes through the branches.",
        "You discover glowing footprints leading toward an ancient ruin. Suddenly, a goblin jumps out from behind a tree!"
      ],
      nextNodeId: "goblin-encounter"
    },

    "goblin-encounter": {
      id: "goblin-encounter",
      type: "combat",
      title: "The First Encounter",
      paragraphs: [
        "A vicious goblin warrior blocks your path.",
        "It raises its rusty blade and prepares to attack.",
        "You grip your weapon tightly. This is your first real test."
      ],
      encounterId: "goblin-warrior-01"
    }
  }
};
