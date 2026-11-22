
"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Play,
  Settings,
  Trophy,
  Sword,
  Shield,
  WandSparkles,
  Target,
  ArrowLeft,
  Heart,
  Swords,
  Save,
  Calendar,
  User,
} from "lucide-react";

import {
  CHARACTER_CLASSES,
  createCharacter,
} from "@/game/engine/ClassEngine";

import {
  createSaveSlot,
  getSaveSlots,
  getActiveSaveSlotId,
  getActiveSaveSlot,
  setActiveSaveSlot,
  loadSaveSlot,
  replaceSaveSlots,
  activateSaveUser,
  type SaveSlot,
} from "@/game/engine/SaveEngine";

import type { CharacterClass } from "@/game/types/character";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getCurrentSupabaseUser,
  syncSaveSlotsFromDatabase,
} from "@/lib/supabase/database";

const classOptions = [
  {
    id: "warrior" as CharacterClass,
    name: "Warrior",
    description: "A powerful fighter with high health and strong defense.",
    icon: Sword,
    color: "text-amber-400",
    border: "border-amber-400",
    background: "bg-amber-400/10",
  },
  {
    id: "mage" as CharacterClass,
    name: "Mage",
    description: "A master of magic with devastating attack power.",
    icon: WandSparkles,
    color: "text-purple-400",
    border: "border-purple-400",
    background: "bg-purple-400/10",
  },
  {
    id: "archer" as CharacterClass,
    name: "Archer",
    description: "A balanced fighter with precision and agility.",
    icon: Target,
    color: "text-green-400",
    border: "border-green-400",
    background: "bg-green-400/10",
  },
];

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [showSaveSlots, setShowSaveSlots] = useState(false);

  const [characterName, setCharacterName] = useState("");
  const [selectedClass, setSelectedClass] =
    useState<CharacterClass>("warrior");

  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
  const [activeSlotId, setActiveSlotId] = useState("");

  const selectedStats = CHARACTER_CLASSES[selectedClass];

  function refreshSaveSlots() {
    const slots = getSaveSlots();

    setSaveSlots(slots);
    setActiveSlotId(getActiveSaveSlotId());
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function syncUserSession() {
      const user = await getCurrentSupabaseUser();
      activateSaveUser(user?.id ?? null);

      if (!user) {
        replaceSaveSlots([]);
        refreshSaveSlots();
        return;
      }

      const databaseSlots = await syncSaveSlotsFromDatabase();
      const currentUser = await getCurrentSupabaseUser();

      if (currentUser?.id !== user.id) return;

      if (databaseSlots !== null) {
        replaceSaveSlots(databaseSlots);
      }

      refreshSaveSlots();
    }

    void syncUserSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void syncUserSession();
    });

    return () => subscription.unsubscribe();
  }, []);

  function formatDate(date: string) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown date";
    }

    return parsedDate.toLocaleString();
  }

  async function startAdventure() {
    const user = await getCurrentSupabaseUser();

    if (!user) {
      alert("Please sign in or create an account before starting an adventure.");
      setShowSettings(true);
      return;
    }

    const character = createCharacter(characterName, selectedClass);

    const activeSlot = getActiveSaveSlot();

    let targetSlotId = activeSlot?.id;

    // Never overwrite an existing adventure.
    if (activeSlot?.saveData) {
      const nextNumber = getSaveSlots().length + 1;

      const newSlot = createSaveSlot(`Adventure ${nextNumber}`);

      if (!newSlot) {
        alert("Unable to create a new save slot.");
        return;
      }

      targetSlotId = newSlot.id;
    }

    if (!targetSlotId || !setActiveSaveSlot(targetSlotId)) {
      alert("Unable to select a save slot.");
      return;
    }

    localStorage.setItem(
      "typequest-character",
      JSON.stringify(character)
    );

    window.location.href = "/game";
  }

  function continueAdventure(slotId: string) {
    const selectedSave = loadSaveSlot(slotId);

    if (!selectedSave) {
      return;
    }

    if (!setActiveSaveSlot(slotId)) {
      alert("Unable to load this adventure.");
      return;
    }

    window.location.href = "/game";
  }

  function createNewAdventureFromSlots() {
    const activeSlot = getActiveSaveSlot();

    if (activeSlot?.saveData) {
      const nextNumber = getSaveSlots().length + 1;
      const newSlot = createSaveSlot(`Adventure ${nextNumber}`);

      if (!newSlot) {
        alert("Unable to create a new save slot.");
        return;
      }

      setActiveSaveSlot(newSlot.id);
    }

    refreshSaveSlots();
    setShowSaveSlots(false);
    setShowCharacterCreation(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#100f19] text-white p-6">
      <div className="relative w-full max-w-5xl min-h-[650px] rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center">

        <div className="absolute inset-0 bg-gradient-to-b from-[#29243d] via-[#171629] to-[#090911]" />

        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_#a78bfa_0%,_transparent_65%)]" />

        <div className="relative z-10 w-full p-6 md:p-10">

          {/* MAIN MENU */}
          {!showCharacterCreation && !showSaveSlots && (
            <div className="text-center">

              <div className="flex justify-center mb-5">
                <Sword size={58} className="text-amber-400" />
              </div>

              <p className="text-amber-400 tracking-[0.4em] text-sm mb-4">
                THE CHRONICLES OF ELDORIA
              </p>

              <h1 className="text-6xl md:text-8xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600">
                TYPEQUEST
              </h1>

              <p className="text-gray-400 mt-5 text-lg">
                Your words are your weapons.
              </p>

              <p className="text-gray-500 text-sm mt-2">
                Your story begins with a single keystroke.
              </p>

              <div className="mt-12 flex flex-col gap-4 max-w-xs mx-auto">

                <button
                  onClick={() => setShowCharacterCreation(true)}
                  className="flex items-center justify-center gap-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 transition"
                >
                  <Play size={20} />
                  NEW GAME
                </button>

                <button
                  onClick={() => {
                    refreshSaveSlots();
                    setShowSaveSlots(true);
                  }}
                  className="flex items-center justify-center gap-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold py-4 transition"
                >
                  <BookOpen size={20} />
                  CONTINUE
                </button>

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center justify-center gap-3 rounded-lg border border-white/20 hover:bg-white/10 py-4 transition"
                >
                  <Settings size={20} />
                  SETTINGS
                </button>

              </div>

              {saveSlots.some((slot) => slot.saveData) && (
                <p className="text-green-400 text-xs mt-4">
                  {saveSlots.filter((slot) => slot.saveData).length} saved adventure(s) available.
                </p>
              )}

              {showSettings && (
                <div className="mt-6 bg-black/40 border border-white/10 rounded-lg p-5 max-w-xs mx-auto">
                  <h2 className="font-bold text-amber-400 mb-2">
                    GAME SETTINGS
                  </h2>
                  <p className="text-sm text-gray-400">
                    Additional settings will be available in a future update.
                  </p>
                </div>
              )}

              <div className="mt-16 flex justify-center items-center gap-2 text-gray-600 text-xs">
                <Trophy size={14} />
                TYPEQUEST • VERSION 0.1.0
              </div>

            </div>
          )}

          {/* SAVE SLOT SELECTION */}
          {showSaveSlots && (
            <div className="max-w-3xl mx-auto">

              <button
                onClick={() => setShowSaveSlots(false)}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition"
              >
                <ArrowLeft size={18} />
                BACK TO MAIN MENU
              </button>

              <div className="text-center mb-8">
                <p className="text-amber-400 tracking-[0.3em] text-xs mb-3">
                  YOUR ADVENTURES
                </p>

                <h2 className="text-3xl md:text-4xl font-black text-amber-300">
                  SELECT SAVE SLOT
                </h2>

                <p className="text-gray-400 mt-3">
                  Choose an adventure to continue.
                </p>
              </div>

              <div className="space-y-4">

                {saveSlots.map((slot) => {
                  const save = slot.saveData;
                  const character = save?.character;
                  const isActive = activeSlotId === slot.id;

                  return (
                    <div
                      key={slot.id}
                      className={`rounded-xl border p-5 transition ${
                        isActive
                          ? "border-amber-400 bg-amber-400/10"
                          : "border-white/10 bg-black/30"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                        <div className="flex-1">

                          <div className="flex items-center gap-3 mb-3">
                            <Save
                              size={22}
                              className="text-amber-400"
                            />

                            <h3 className="text-lg font-bold text-white">
                              {slot.name}
                            </h3>

                            {isActive && (
                              <span className="text-[10px] font-bold text-amber-300 border border-amber-400/40 rounded px-2 py-1">
                                ACTIVE
                              </span>
                            )}
                          </div>

                          {save && character ? (
                            <>
                              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-300">

                                <span className="flex items-center gap-2">
                                  <User size={15} className="text-amber-400" />
                                  {character.name}
                                </span>

                                <span className="flex items-center gap-2">
                                  <Sword size={15} className="text-amber-400" />
                                  {character.characterClass.toUpperCase()}
                                </span>

                                <span className="flex items-center gap-2">
                                  <Trophy size={15} className="text-amber-400" />
                                  Level {character.level}
                                </span>

                              </div>

                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                                <Calendar size={14} />
                                Last saved: {formatDate(slot.updatedAt)}
                              </div>

                              <div className="text-xs text-gray-500 mt-2">
                                HP: {character.currentHp} / {character.maxHp}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">
                              Empty save slot — no adventure saved yet.
                            </div>
                          )}

                        </div>

                        <button
                          onClick={() => continueAdventure(slot.id)}
                          disabled={!save}
                          className={`rounded-lg px-6 py-3 font-bold text-sm transition ${
                            save
                              ? "bg-amber-500 hover:bg-amber-400 text-black"
                              : "bg-white/5 text-gray-600 cursor-not-allowed"
                          }`}
                        >
                          {save ? "CONTINUE" : "EMPTY SLOT"}
                        </button>

                      </div>
                    </div>
                  );
                })}

              </div>

              <button
                onClick={createNewAdventureFromSlots}
                className="w-full mt-8 flex items-center justify-center gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-bold py-4 transition"
              >
                <Play size={20} />
                CREATE NEW ADVENTURE
              </button>

            </div>
          )}

          {/* CHARACTER CREATION */}
          {showCharacterCreation && (
            <div className="max-w-3xl mx-auto">

              <button
                onClick={() => setShowCharacterCreation(false)}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition"
              >
                <ArrowLeft size={18} />
                BACK TO MAIN MENU
              </button>

              <div className="text-center mb-8">
                <p className="text-amber-400 tracking-[0.3em] text-xs mb-3">
                  YOUR JOURNEY BEGINS
                </p>

                <h2 className="text-3xl md:text-4xl font-black text-amber-300">
                  CREATE YOUR HERO
                </h2>

                <p className="text-gray-400 mt-3">
                  Choose your identity and prepare for the adventure.
                </p>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-amber-300 mb-3">
                  CHARACTER NAME
                </label>

                <input
                  type="text"
                  maxLength={20}
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Enter your hero's name..."
                  className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-4 text-white outline-none focus:border-amber-400 transition"
                />
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-bold text-amber-300 mb-4">
                  SELECT YOUR CLASS
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {classOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedClass === option.id;

                    return (
                      <button
                        key={option.id}
                        onClick={() => setSelectedClass(option.id)}
                        className={`text-left p-5 rounded-xl border-2 transition ${
                          isSelected
                            ? `${option.border} ${option.background}`
                            : "border-white/10 bg-black/20 hover:border-white/30"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <Icon size={34} className={option.color} />

                          {isSelected && (
                            <span className="text-xs text-amber-300 font-bold">
                              SELECTED
                            </span>
                          )}
                        </div>

                        <h4 className={`text-lg font-bold ${option.color}`}>
                          {option.name}
                        </h4>

                        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                          {option.description}
                        </p>
                      </button>
                    );
                  })}

                </div>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-xl p-6 mb-8">

                <div className="flex items-center gap-3 mb-5">
                  <Swords className="text-amber-400" size={22} />

                  <h3 className="font-bold text-amber-300">
                    {selectedClass.toUpperCase()} ATTRIBUTES
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-4">

                  <div className="text-center">
                    <Heart className="mx-auto text-red-400 mb-2" size={22} />
                    <p className="text-2xl font-black">
                      {selectedStats.maxHp}
                    </p>
                    <p className="text-xs text-gray-500">MAX HP</p>
                  </div>

                  <div className="text-center">
                    <Sword className="mx-auto text-amber-400 mb-2" size={22} />
                    <p className="text-2xl font-black">
                      {selectedStats.baseAttack}
                    </p>
                    <p className="text-xs text-gray-500">ATTACK</p>
                  </div>

                  <div className="text-center">
                    <Shield className="mx-auto text-blue-400 mb-2" size={22} />
                    <p className="text-2xl font-black">
                      {selectedStats.baseDefense}
                    </p>
                    <p className="text-xs text-gray-500">DEFENSE</p>
                  </div>

                </div>
              </div>

              <button
                onClick={startAdventure}
                className="w-full flex items-center justify-center gap-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black py-4 transition"
              >
                <Play size={20} />
                BEGIN ADVENTURE
              </button>

              <p className="text-center text-gray-500 text-xs mt-4">
                Your class determines your starting attributes.
              </p>

            </div>
          )}

        </div>
      </div>
    </main>
  );
}
