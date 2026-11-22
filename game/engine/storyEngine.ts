
import type {
  StoryChapter,
  StoryNode,
  StoryChoice
} from "@/game/types/story";

// Find a story node by its ID
export function getStoryNode(
  chapter: StoryChapter,
  nodeId: string
): StoryNode | undefined {
  return chapter.nodes[nodeId];
}

// Find the selected choice
export function selectStoryChoice(
  node: StoryNode,
  choiceId: string
): StoryChoice | undefined {
  if (node.type !== "choice") {
    return undefined;
  }

  return node.choices.find(
    (choice) => choice.id === choiceId
  );
}

// Determine the next story node
export function getNextNodeId(
  node: StoryNode
): string | undefined {
  if (node.type === "narrative") {
    return node.nextNodeId;
  }

  return undefined;
}
