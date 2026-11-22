
export type ItemType =
  | "weapon"
  | "armor"
  | "potion"
  | "quest";

export type InventoryItem = {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  quantity: number;
  equipped: boolean;
};

export type PlayerInventory = {
  items: InventoryItem[];
};
