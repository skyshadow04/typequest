
import type {
  InventoryItem,
  PlayerInventory,
} from "@/game/types/inventory";

export const INITIAL_INVENTORY: PlayerInventory = {
  items: [],
};

export function addItem(
  inventory: PlayerInventory,
  item: InventoryItem
): PlayerInventory {
  const existingItem = inventory.items.find(
    (currentItem) => currentItem.id === item.id
  );

  if (existingItem) {
    return {
      ...inventory,
      items: inventory.items.map((currentItem) =>
        currentItem.id === item.id
          ? {
              ...currentItem,
              quantity: currentItem.quantity + item.quantity,
            }
          : currentItem
      ),
    };
  }

  return {
    ...inventory,
    items: [...inventory.items, item],
  };
}

export function removeItem(
  inventory: PlayerInventory,
  itemId: string
): PlayerInventory {
  return {
    ...inventory,
    items: inventory.items
      .map((item) =>
        item.id === itemId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
      .filter((item) => item.quantity > 0),
  };
}

export function equipItem(
  inventory: PlayerInventory,
  itemId: string
): PlayerInventory {
  const selectedItem = inventory.items.find(
    (item) => item.id === itemId
  );

  if (!selectedItem) return inventory;

  if (
    selectedItem.type !== "weapon" &&
    selectedItem.type !== "armor"
  ) {
    return inventory;
  }

  return {
    ...inventory,
    items: inventory.items.map((item) =>
      item.type === selectedItem.type
        ? {
            ...item,
            equipped: item.id === itemId,
          }
        : item
    ),
  };
}

export function unequipItem(
  inventory: PlayerInventory,
  itemId: string
): PlayerInventory {
  return {
    ...inventory,
    items: inventory.items.map((item) =>
      item.id === itemId
        ? { ...item, equipped: false }
        : item
    ),
  };
}
