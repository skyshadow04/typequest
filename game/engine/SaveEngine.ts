
import type { PlayerCharacter } from "@/game/types/character";
import type { PlayerInventory } from "@/game/types/inventory";
import type { BattleState } from "@/game/engine/BattleEngine";
import type { StoryChoice } from "@/game/engine/RewardEngine";
import type { ActiveSkillState } from "@/game/engine/SkillEngine";
import {
  deleteSaveSlotFromDatabase,
  upsertSaveSlotToDatabase,
} from "@/lib/supabase/database";

export type SavedBattleState = {
  storyChoice: StoryChoice;
  battle: BattleState;
  round: number;
  activeSkills: ActiveSkillState;
  currentPassageId: string;
  usedPassageIds: string[];
  rewardCollected: boolean;
  xpAwarded: boolean;
};

export type GameSaveData = {
  version: 1;
  character: PlayerCharacter;
  inventory: PlayerInventory;
  currentNodeId: string;
  decisions: Record<string, string>;
  savedAt: string;
  battleState?: SavedBattleState;
};

export type SaveSlot = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  saveData: GameSaveData | null;
};

const SAVE_KEY = "typequest-save";
const SLOTS_KEY = "typequest-save-slots";
const ACTIVE_SLOT_KEY = "typequest-active-slot";

const DEFAULT_SLOT_ID = "save-slot-1";

function isValidSave(data: unknown): data is GameSaveData {
  if (!data || typeof data !== "object") return false;

  const save = data as Record<string, unknown>;

  return (
    save.version === 1 &&
    typeof save.character === "object" &&
    save.character !== null &&
    typeof save.inventory === "object" &&
    save.inventory !== null &&
    typeof save.currentNodeId === "string" &&
    typeof save.decisions === "object" &&
    save.decisions !== null &&
    typeof save.savedAt === "string"
  );
}

function isValidSlot(slot: unknown): slot is SaveSlot {
  if (!slot || typeof slot !== "object") return false;

  const item = slot as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string" &&
    (item.saveData === null || isValidSave(item.saveData))
  );
}

function readSlots(): SaveSlot[] {
  if (typeof window === "undefined") return [];

  try {
    const storedSlots = localStorage.getItem(SLOTS_KEY);

    if (storedSlots) {
      const parsed: unknown = JSON.parse(storedSlots);

      if (
        Array.isArray(parsed) &&
        parsed.every(isValidSlot)
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to read save slots:", error);
  }

  return [];
}

function writeSlots(slots: SaveSlot[]): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
}

export function replaceSaveSlots(slots: SaveSlot[]): void {
  if (typeof window === "undefined") return;

  writeSlots(slots);

  if (slots.length === 0) return;

  const activeSlotId = localStorage.getItem(ACTIVE_SLOT_KEY);

  if (!slots.some((slot) => slot.id === activeSlotId)) {
    localStorage.setItem(ACTIVE_SLOT_KEY, slots[0].id);
  }

  const activeSlot = slots.find(
    (slot) => slot.id === (localStorage.getItem(ACTIVE_SLOT_KEY) ?? "")
  );

  syncLegacySave(activeSlot?.saveData ?? null);
}

function syncLegacySave(saveData: GameSaveData | null): void {
  if (typeof window === "undefined") return;

  if (saveData) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } else {
    localStorage.removeItem(SAVE_KEY);
  }
}

// Create the first slot and migrate the previous single save if necessary.
function ensureSlots(): SaveSlot[] {
  if (typeof window === "undefined") return [];

  let slots = readSlots();

  if (slots.length === 0) {
    let oldSave: GameSaveData | null = null;

    try {
      const legacyData = localStorage.getItem(SAVE_KEY);

      if (legacyData) {
        const parsed: unknown = JSON.parse(legacyData);

        if (isValidSave(parsed)) {
          oldSave = parsed;
        }
      }
    } catch (error) {
      console.error("Failed to migrate previous save:", error);
    }

    const now = new Date().toISOString();

    slots = [
      {
        id: DEFAULT_SLOT_ID,
        name: "Adventure 1",
        createdAt: now,
        updatedAt: oldSave?.savedAt ?? now,
        saveData: oldSave,
      },
    ];

    writeSlots(slots);
    localStorage.setItem(ACTIVE_SLOT_KEY, DEFAULT_SLOT_ID);
  }

  let activeSlotId = localStorage.getItem(ACTIVE_SLOT_KEY);

  if (!slots.some((slot) => slot.id === activeSlotId)) {
    activeSlotId = slots[0].id;
    localStorage.setItem(ACTIVE_SLOT_KEY, activeSlotId);
  }

  const activeSlot = slots.find(
    (slot) => slot.id === activeSlotId
  );

  if (activeSlot) {
    syncLegacySave(activeSlot.saveData);
  }

  return slots;
}

// GET ALL SAVE SLOTS
export function getSaveSlots(): SaveSlot[] {
  return ensureSlots();
}

// GET THE CURRENT ACTIVE SLOT ID
export function getActiveSaveSlotId(): string {
  if (typeof window === "undefined") return DEFAULT_SLOT_ID;

  ensureSlots();

  return (
    localStorage.getItem(ACTIVE_SLOT_KEY) ??
    DEFAULT_SLOT_ID
  );
}

// GET THE CURRENT ACTIVE SLOT
export function getActiveSaveSlot(): SaveSlot | null {
  const slots = ensureSlots();
  const activeId = getActiveSaveSlotId();

  return slots.find((slot) => slot.id === activeId) ?? null;
}

// CREATE A NEW EMPTY SAVE SLOT
export function createSaveSlot(name: string): SaveSlot | null {
  if (typeof window === "undefined") return null;

  const cleanName = name.trim();

  if (!cleanName) return null;

  const slots = ensureSlots();

  const newSlot: SaveSlot = {
    id: crypto.randomUUID(),
    name: cleanName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    saveData: null,
  };

  const updatedSlots = [...slots, newSlot];

  writeSlots(updatedSlots);
  void upsertSaveSlotToDatabase(newSlot);

  return newSlot;
}

// RENAME A SAVE SLOT
export function renameSaveSlot(
  slotId: string,
  newName: string
): boolean {
  if (typeof window === "undefined") return false;

  const cleanName = newName.trim();

  if (!cleanName) return false;

  const slots = ensureSlots();

  const exists = slots.some((slot) => slot.id === slotId);

  if (!exists) return false;

  const updatedSlots = slots.map((slot) =>
    slot.id === slotId
      ? {
          ...slot,
          name: cleanName,
          updatedAt: new Date().toISOString(),
        }
      : slot
  );

  writeSlots(updatedSlots);
  void upsertSaveSlotToDatabase(
    updatedSlots.find((slot) => slot.id === slotId)!
  );

  return true;
}

// SWITCH THE ACTIVE SAVE SLOT
export function setActiveSaveSlot(slotId: string): boolean {
  if (typeof window === "undefined") return false;

  const slots = ensureSlots();

  const selectedSlot = slots.find(
    (slot) => slot.id === slotId
  );

  if (!selectedSlot) return false;

  localStorage.setItem(ACTIVE_SLOT_KEY, slotId);

  syncLegacySave(selectedSlot.saveData);

  return true;
}

// LOAD A SPECIFIC SAVE SLOT
export function loadSaveSlot(
  slotId: string
): GameSaveData | null {
  const slots = ensureSlots();

  const selectedSlot = slots.find(
    (slot) => slot.id === slotId
  );

  if (!selectedSlot) return null;

  return selectedSlot.saveData;
}

// DELETE ONE SAVE SLOT
export function deleteSaveSlot(slotId: string): boolean {
  if (typeof window === "undefined") return false;

  const slots = ensureSlots();

  if (slots.length <= 1) {
    return false;
  }

  const slotExists = slots.some(
    (slot) => slot.id === slotId
  );

  if (!slotExists) return false;

  const remainingSlots = slots.filter(
    (slot) => slot.id !== slotId
  );

  const activeSlotId = getActiveSaveSlotId();

  if (activeSlotId === slotId) {
    const nextSlot = remainingSlots[0];

    localStorage.setItem(ACTIVE_SLOT_KEY, nextSlot.id);
    syncLegacySave(nextSlot.saveData);
  }

  writeSlots(remainingSlots);
  void deleteSaveSlotFromDatabase(slotId);

  return true;
}

// SAVE THE CURRENT GAME TO THE ACTIVE SLOT
export function saveGame(
  character: PlayerCharacter,
  inventory: PlayerInventory,
  currentNodeId: string,
  decisions: Record<string, string>,
  battleState?: SavedBattleState | null
): boolean {
  if (typeof window === "undefined") return false;

  try {
    const slots = ensureSlots();
    const activeSlotId = getActiveSaveSlotId();

    const existingSlot = slots.find(
      (slot) => slot.id === activeSlotId
    );

    const existingSave = existingSlot?.saveData ?? null;

    const saveData: GameSaveData = {
      version: 1,
      character,
      inventory,
      currentNodeId,
      decisions,
      savedAt: new Date().toISOString(),

      ...(battleState === null
        ? {}
        : battleState !== undefined
          ? { battleState }
          : existingSave?.battleState
            ? { battleState: existingSave.battleState }
            : {}),
    };

    const updatedSlots = slots.map((slot) =>
      slot.id === activeSlotId
        ? {
            ...slot,
            updatedAt: saveData.savedAt,
            saveData,
          }
        : slot
    );

    writeSlots(updatedSlots);
    void upsertSaveSlotToDatabase(
      updatedSlots.find((slot) => slot.id === activeSlotId)!
    );

    // Keep the previous save key synchronized for compatibility.
    syncLegacySave(saveData);

    return true;
  } catch (error) {
    console.error("Failed to save game:", error);
    return false;
  }
}

// LOAD THE CURRENT ACTIVE SLOT
export function loadGame(): GameSaveData | null {
  if (typeof window === "undefined") return null;

  try {
    const activeSlot = getActiveSaveSlot();

    if (!activeSlot?.saveData) return null;

    if (!isValidSave(activeSlot.saveData)) {
      console.warn("Invalid save data.");
      return null;
    }

    return activeSlot.saveData;
  } catch (error) {
    console.error("Failed to load game:", error);
    return null;
  }
}

// CHECK WHETHER THE ACTIVE SLOT HAS A SAVE
export function hasSavedGame(): boolean {
  return loadGame() !== null;
}

// CLEAR THE CURRENT ACTIVE SLOT'S SAVE DATA
export function deleteSavedGame(): void {
  if (typeof window === "undefined") return;

  const slots = ensureSlots();
  const activeSlotId = getActiveSaveSlotId();

  const updatedSlots = slots.map((slot) =>
    slot.id === activeSlotId
      ? {
          ...slot,
          saveData: null,
          updatedAt: new Date().toISOString(),
        }
      : slot
  );

  writeSlots(updatedSlots);
  syncLegacySave(null);
}
