
"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  RotateCcw,
  Search,
  Shield,
  Save,
  CheckCircle,
} from "lucide-react";

import { chapter1 } from "@/game/data/chapters/chapter1";

import {
  getStoryNode,
  getNextNodeId,
  selectStoryChoice,
} from "@/game/engine/storyEngine";

import type { StoryDecisions } from "@/game/types/story";
import type { PlayerCharacter } from "@/game/types/character";

import BattleInterface from "@/game/components/BattleInterface";

import {
  activateSaveUser,
  loadGame,
  replaceSaveSlots,
  saveGame,
} from "@/game/engine/SaveEngine";

import {
  getCurrentSupabaseUser,
  syncSaveSlotsFromDatabase,
} from "@/lib/supabase/database";

import { INITIAL_INVENTORY } from "@/game/engine/InventoryEngine";

export default function GamePage() {
  const [currentNodeId, setCurrentNodeId] = useState(
    chapter1.initialNodeId
  );

  const [decisions, setDecisions] = useState<StoryDecisions>({});
  const [character, setCharacter] = useState<PlayerCharacter | null>(null);

  const [gameLoaded, setGameLoaded] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState(false);

  // LOAD THE SELECTED SAVE SLOT
  useEffect(() => {
    let active = true;

    async function initializeGame() {
      try {
        const user = await getCurrentSupabaseUser();

        if (!active) return;

        if (!user) {
          activateSaveUser(null);
          replaceSaveSlots([]);
          setGameLoaded(true);
          return;
        }

        activateSaveUser(user.id);

        const databaseSlots = await syncSaveSlotsFromDatabase();
        const currentUser = await getCurrentSupabaseUser();

        if (!active || currentUser?.id !== user.id) return;

        if (databaseSlots !== null) {
          replaceSaveSlots(databaseSlots);
        }

        // Always load from the currently selected save slot.
        const savedGame = loadGame();

        if (!savedGame) {
          setGameLoaded(true);
          return;
        }

        // The selected slot's character is the source of truth.
        setCharacter(savedGame.character);

        // Keep compatibility with existing components that still
        // read the shared character key.
        localStorage.setItem(
          "typequest-character",
          JSON.stringify(savedGame.character)
        );

        const savedNode = getStoryNode(
          chapter1,
          savedGame.currentNodeId
        );

        if (savedNode) {
          setCurrentNodeId(savedGame.currentNodeId);
          setDecisions(savedGame.decisions as StoryDecisions);
        }

        setGameLoaded(true);
      } catch (error) {
        console.error("Failed to initialize game:", error);

        if (active) {
          setGameLoaded(true);
        }
      }
    }

    void initializeGame();

    return () => {
      active = false;
    };
  }, []);

  // AUTOMATICALLY SAVE STORY PROGRESS
  useEffect(() => {
    if (!gameLoaded || !character) return;

    let active = true;

    const savedGame = loadGame();
    const inventory = savedGame?.inventory ?? INITIAL_INVENTORY;

    // Always save the character belonging to this selected slot.
    void saveGame(
      character,
      inventory,
      currentNodeId,
      decisions
    ).then((success) => {
      if (!active) return;

      setSaveError(!success);

      setSaveMessage(
        success
          ? "Progress saved to your account."
          : "Cloud save failed. Check your sign-in and Supabase settings."
      );
    });

    return () => {
      active = false;
    };
  }, [currentNodeId, decisions, gameLoaded, character]);

  const currentNode = getStoryNode(chapter1, currentNodeId);

  // MANUAL SAVE
  async function handleManualSave() {
    if (!character) {
      setSaveError(true);
      setSaveMessage("No character was loaded. Your game was not saved.");
      return;
    }

    const savedGame = loadGame();
    const inventory = savedGame?.inventory ?? INITIAL_INVENTORY;

    setSaveMessage("Saving to your account...");
    setSaveError(false);

    const success = await saveGame(
      character,
      inventory,
      currentNodeId,
      decisions
    );

    setSaveError(!success);

    setSaveMessage(
      success
        ? "Game saved to your account."
        : "Cloud save failed. Check your sign-in and Supabase settings."
    );
  }

  function handleContinue() {
    if (!currentNode) return;

    const nextNodeId = getNextNodeId(currentNode);

    if (nextNodeId) {
      setCurrentNodeId(nextNodeId);
      setSaveMessage("");
    }
  }

  function handleChoice(choiceId: string) {
    if (!currentNode || currentNode.type !== "choice") {
      return;
    }

    const selectedChoice = selectStoryChoice(
      currentNode,
      choiceId
    );

    if (!selectedChoice) return;

    setDecisions((previous) => ({
      ...previous,
      [selectedChoice.decisionKey]:
        selectedChoice.decisionValue,
    }));

    setCurrentNodeId(selectedChoice.nextNodeId);
    setSaveMessage("");
  }

  function restartStory() {
    setCurrentNodeId(chapter1.initialNodeId);
    setDecisions({});
    setSaveMessage("");
  }

  if (!gameLoaded) {
    return (
      <main className="min-h-screen bg-[#100f19] text-white flex items-center justify-center">
        <p className="text-amber-300">
          Loading your adventure...
        </p>
      </main>
    );
  }

  // Do not create a replacement character from shared localStorage.
  if (!character) {
    return (
      <main className="min-h-screen bg-[#100f19] text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-white/5 border border-white/10 rounded-xl p-8">
          <AlertCircle
            size={40}
            className="text-amber-400 mx-auto mb-4"
          />

          <h1 className="text-2xl font-bold text-amber-300 mb-3">
            No Saved Character Found
          </h1>

          <p className="text-gray-400 mb-6">
            This adventure does not contain valid character data.
            Return to the main menu and select another save slot
            or create a new adventure.
          </p>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-lg transition"
          >
            Return to Main Menu
          </button>
        </div>
      </main>
    );
  }

  if (!currentNode) {
    return <div>Story node not found.</div>;
  }

  const storyChoice =
    decisions["first-choice"] === "investigate-forest"
      ? "investigate-forest"
      : "protect-village";

  return (
    <main className="min-h-screen bg-[#100f19] text-white p-6">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <header className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center mb-8">
          <div>
            <p className="text-amber-400 text-sm tracking-widest">
              TYPEQUEST
            </p>

            <h1 className="text-2xl font-bold">
              {chapter1.title}
            </h1>

            <p className="text-sm text-gray-400 mt-1">
              Playing as {character.name} the{" "}
              {character.characterClass}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleManualSave}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition"
            >
              <Save size={16} />
              Save Game
            </button>

            <button
              onClick={restartStory}
              className="flex items-center gap-2 text-gray-400 hover:text-white"
            >
              <RotateCcw size={16} />
              Restart Story
            </button>
          </div>
        </header>

        {/* SAVE MESSAGE */}
        {saveMessage && (
          <div
            role="status"
            className={`mb-5 flex items-center gap-2 text-sm ${
              saveError ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {saveError ? (
              <AlertCircle size={16} />
            ) : (
              <CheckCircle size={16} />
            )}

            {saveMessage}
          </div>
        )}

        {/* STORY PANEL */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-10">

          <div className="flex items-center gap-2 text-amber-400 mb-6">
            <BookOpen size={20} />

            <span className="text-sm tracking-widest uppercase">
              Chapter 1
            </span>
          </div>

          <h2 className="text-3xl font-bold mb-8">
            {currentNode.title}
          </h2>

          <div className="space-y-5 mb-10">
            {currentNode.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-gray-300 leading-8 text-lg"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* NARRATIVE CONTROLS */}
          {currentNode.type === "narrative" && (
            <button
              onClick={handleContinue}
              className="flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-lg transition"
            >
              Continue Story
              <ArrowRight size={18} />
            </button>
          )}

          {/* PLAYER CHOICES */}
          {currentNode.type === "choice" && (
            <div className="space-y-4">
              <h3 className="text-amber-400 font-semibold">
                What will you do?
              </h3>

              {currentNode.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleChoice(choice.id)}
                  className="w-full text-left p-5 rounded-lg border border-white/10 bg-white/5 hover:bg-amber-500/10 hover:border-amber-500 transition"
                >
                  <div className="flex items-center gap-3">
                    {choice.id === "protect-village" ? (
                      <Shield className="text-amber-400" />
                    ) : (
                      <Search className="text-amber-400" />
                    )}

                    <div className="flex-1">
                      <h4 className="font-bold text-white">
                        {choice.label}
                      </h4>

                      <p className="text-sm text-gray-400 mt-1">
                        {choice.description}
                      </p>
                    </div>

                    <ArrowRight size={18} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* COMBAT */}
          {currentNode.type === "combat" && (
            <div className="mt-8 border-t border-white/10 pt-8">
              <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-5 mb-6">
                <h3 className="text-xl font-bold text-red-400 mb-2">
                  <span className="inline-flex items-center gap-2">
                    <Shield size={22} />
                    Enemy Encounter!
                  </span>
                </h3>

                <p className="text-gray-300">
                  A Goblin Warrior is blocking your path.
                  Prepare to fight!
                </p>

                <p className="text-sm text-gray-400 mt-3">
                  Encounter ID: {currentNode.encounterId}
                </p>
              </div>

              <BattleInterface
                key={storyChoice}
                storyChoice={storyChoice}
              />
            </div>
          )}
        </section>

        {/* DECISION HISTORY */}
        <section className="mt-6 bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">
            YOUR STORY DECISIONS
          </h3>

          {Object.keys(decisions).length === 0 ? (
            <p className="text-sm text-gray-500">
              You haven't made any decisions yet.
            </p>
          ) : (
            Object.entries(decisions).map(([key, value]) => (
              <div
                key={key}
                className="text-sm text-amber-400"
              >
                {key}: {value}
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
