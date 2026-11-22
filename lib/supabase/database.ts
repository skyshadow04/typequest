import type { SaveSlot } from "@/game/engine/SaveEngine";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type DatabaseSaveSlot = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  save_data: SaveSlot["saveData"];
};

export async function getCurrentSupabaseUser() {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) return null;

  return data.user;
}

export async function syncSaveSlotsFromDatabase(): Promise<SaveSlot[] | null> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("save_slots")
    .select("id,name,created_at,updated_at,save_data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load database save slots:", error);
    return null;
  }

  return (data as DatabaseSaveSlot[]).map((slot) => ({
    id: slot.id,
    name: slot.name,
    createdAt: slot.created_at,
    updatedAt: slot.updated_at,
    saveData: slot.save_data,
  }));
}

export async function upsertSaveSlotToDatabase(slot: SaveSlot): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { error } = await supabase.from("save_slots").upsert(
    {
      id: slot.id,
      user_id: user.id,
      name: slot.name,
      created_at: slot.createdAt,
      updated_at: slot.updatedAt,
      save_data: slot.saveData,
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("Failed to save slot to database:", error);
    return false;
  }

  return true;
}

export async function deleteSaveSlotFromDatabase(slotId: string): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("save_slots")
    .delete()
    .eq("id", slotId);

  if (error) {
    console.error("Failed to delete database save slot:", error);
    return false;
  }

  return true;
}
