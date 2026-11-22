
export type StoryChoice = {
  id: string;
  label: string;
  description: string;
  nextNodeId: string;
  decisionKey: string;
  decisionValue: string;
};

export type NarrativeNode = {
  id: string;
  type: "narrative";
  title: string;
  paragraphs: string[];
  nextNodeId: string;
};

export type ChoiceNode = {
  id: string;
  type: "choice";
  title: string;
  paragraphs: string[];
  choices: StoryChoice[];
};

export type CombatNode = {
  id: string;
  type: "combat";
  title: string;
  paragraphs: string[];
  encounterId: string;
};

export type StoryNode =
  | NarrativeNode
  | ChoiceNode
  | CombatNode;

export type StoryChapter = {
  id: string;
  title: string;
  initialNodeId: string;
  nodes: Record<string, StoryNode>;
};

export type StoryDecisions = Record<string, string>;
