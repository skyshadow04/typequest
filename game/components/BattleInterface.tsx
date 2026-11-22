
"use client";

import { useEffect, useRef, useState } from "react";

import TypingEngine, {
  type TypingResult,
} from "@/game/components/TypingEngine";

import {
  INITIAL_BATTLE_STATE,
  resolvePlayerTurn,
  resolveFailedAttack,
} from "@/game/engine/BattleEngine";

import {
  getStoryReward,
  type StoryChoice,
} from "@/game/engine/RewardEngine";

import {
  INITIAL_INVENTORY,
  addItem,
  equipItem,
  unequipItem,
} from "@/game/engine/InventoryEngine";

import type {
  InventoryItem,
  PlayerInventory,
} from "@/game/types/inventory";

import { goblinBattlePassages } from "@/game/data/battles/goblinBattle";

import {
  INITIAL_CHARACTER,
  type PlayerCharacter,
} from "@/game/types/character";

import { createCharacter } from "@/game/engine/ClassEngine";

import { addExperience } from "@/game/engine/CharacterEngine";
import { getExperienceReward } from "@/game/engine/ExperienceEngine";

import {
  INITIAL_ACTIVE_SKILLS,
  activateClassSkill,
  calculateSkillDamage,
  calculateSkillDefense,
  getClassSkill,
  type ActiveSkillState,
} from "@/game/engine/SkillEngine";

import {
  loadGame,
  saveGame,
  type SavedBattleState,
} from "@/game/engine/SaveEngine";

type BattleInterfaceProps = {
  storyChoice: StoryChoice;
};

const CLASS_TYPING_PASSAGES: Record<
  PlayerCharacter["characterClass"],
  string[]
> = {
  warrior: [
    "Raise your shield and stand firm against the goblin assault.",
    "Strike with courage and protect the people of Eldoria.",
    "Brace your stance, find the opening, and deliver a heavy blow.",
    "A true warrior never abandons those who stand behind them.",
    "Hold the line and let your courage overcome your fear.",
    "With one final strike, drive the goblin from the battlefield.",
  ],
  mage: [
    "Ignis arcanum, awaken the flame within my hands.",
    "By ancient wisdom, let the arcane barrier protect me.",
    "Gather the scattered mana and unleash its hidden power.",
    "Lumos aeternum, reveal the weakness of my enemy.",
    "The stars align as the spell flows through my spirit.",
    "Fulminis ultima, let the final bolt end this battle.",
  ],
  archer: [
    "Draw the bowstring slowly and keep your breathing steady.",
    "Choose the target, measure the distance, and aim true.",
    "A steady hand sends the arrow straight through the opening.",
    "Stay silent, watch the movement, and never waste a shot.",
    "Track the enemy carefully and release at the perfect moment.",
    "One precise arrow will bring this encounter to an end.",
  ],
};

export default function BattleInterface({
  storyChoice,
}: BattleInterfaceProps) {
  const passages = goblinBattlePassages[storyChoice];
  const reward = getStoryReward(storyChoice);

  const [battle, setBattle] = useState(INITIAL_BATTLE_STATE);
  const [round, setRound] = useState(0);

  const [inventory, setInventory] =
    useState<PlayerInventory>(INITIAL_INVENTORY);

  const [character, setCharacter] =
    useState<PlayerCharacter>(INITIAL_CHARACTER);

  const [characterLoaded, setCharacterLoaded] = useState(false);

  const [rewardCollected, setRewardCollected] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [levelUpMessage, setLevelUpMessage] = useState("");

  const [activeSkills, setActiveSkills] =
    useState<ActiveSkillState>(INITIAL_ACTIVE_SKILLS);

  const xpAwardedRef = useRef(false);

  const xpReward = getExperienceReward("goblin-warrior-01");
  const classSkill = getClassSkill(character.characterClass);

  const [currentPassageId, setCurrentPassageId] = useState(
    passages[0].id
  );

  const [usedPassageIds, setUsedPassageIds] = useState<string[]>([
    passages[0].id,
  ]);

  const currentPassage =
    passages.find((passage) => passage.id === currentPassageId) ??
    passages[0];

  const currentPassageIndex = Math.max(
    0,
    passages.findIndex((passage) => passage.id === currentPassage.id)
  );

  const classTypingPassage =
    CLASS_TYPING_PASSAGES[character.characterClass]?.[
      currentPassageIndex %
        CLASS_TYPING_PASSAGES[character.characterClass].length
    ] ?? currentPassage.text;

  const difficulty =
    round + 1 < 2
      ? "easy"
      : round + 1 < 4
        ? "medium"
        : "hard";

  // LOAD CHARACTER, INVENTORY, AND SAVED BATTLE
  useEffect(() => {
    const savedGame = loadGame();

    let loadedCharacter = createCharacter("Adventurer", "warrior");

    if (savedGame?.character) {
      loadedCharacter = savedGame.character;
    } else {
      try {
        const savedCharacter = localStorage.getItem(
          "typequest-character"
        );

        if (savedCharacter) {
          const parsed = JSON.parse(savedCharacter) as PlayerCharacter;

          if (
            parsed &&
            typeof parsed.name === "string" &&
            typeof parsed.maxHp === "number" &&
            typeof parsed.baseAttack === "number" &&
            typeof parsed.baseDefense === "number" &&
            ["warrior", "mage", "archer"].includes(
              parsed.characterClass
            )
          ) {
            loadedCharacter = parsed;
          }
        }
      } catch {
        // Use a fresh Warrior if saved character data is invalid.
      }
    }

    const loadedInventory =
      savedGame?.inventory ?? INITIAL_INVENTORY;

    setInventory(loadedInventory);

    const startingHp = Math.min(
      Math.max(
        loadedCharacter.currentHp ?? loadedCharacter.maxHp,
        0
      ),
      loadedCharacter.maxHp
    );

    loadedCharacter = {
      ...loadedCharacter,
      currentHp: startingHp,
    };

    setCharacter(loadedCharacter);

    const savedBattle = savedGame?.battleState;

    // Restore the battle only if it belongs to the current story path.
    if (
      savedBattle &&
      savedBattle.storyChoice === storyChoice &&
      savedBattle.battle &&
      typeof savedBattle.battle.playerHp === "number" &&
      typeof savedBattle.battle.enemyHp === "number"
    ) {
      setBattle(savedBattle.battle);

      setRound(savedBattle.round ?? 0);

      setActiveSkills(
        savedBattle.activeSkills ?? INITIAL_ACTIVE_SKILLS
      );

      setCurrentPassageId(
        passages.some(
          (passage) =>
            passage.id === savedBattle.currentPassageId
        )
          ? savedBattle.currentPassageId
          : passages[0].id
      );

      setUsedPassageIds(
        Array.isArray(savedBattle.usedPassageIds)
          ? savedBattle.usedPassageIds
          : [passages[0].id]
      );

      setRewardCollected(
        savedBattle.rewardCollected ?? false
      );

      setXpAwarded(savedBattle.xpAwarded ?? false);

      xpAwardedRef.current =
        savedBattle.xpAwarded ?? false;
    } else {
      setBattle({
        ...INITIAL_BATTLE_STATE,
        playerHp: startingHp,
        playerMaxHp: loadedCharacter.maxHp,
      });
    }

    setCharacterLoaded(true);
  }, []);

  // SAVE CHARACTER PROFILE
  useEffect(() => {
    if (!characterLoaded) return;

    localStorage.setItem(
      "typequest-character",
      JSON.stringify(character)
    );
  }, [character, characterLoaded]);

  // AUTOMATICALLY SAVE COMPLETE BATTLE STATE
  useEffect(() => {
    if (!characterLoaded) return;

    const existingSave = loadGame();

    const battleState: SavedBattleState = {
      storyChoice,
      battle,
      round,
      activeSkills,
      currentPassageId,
      usedPassageIds,
      rewardCollected,
      xpAwarded,
    };

    saveGame(
      character,
      inventory,
      existingSave?.currentNodeId ?? "opening",
      existingSave?.decisions ?? {},
      battleState
    );
  }, [
    character,
    inventory,
    battle,
    round,
    activeSkills,
    currentPassageId,
    usedPassageIds,
    rewardCollected,
    xpAwarded,
    characterLoaded,
    storyChoice,
  ]);

  // KEEP CHARACTER HP SYNCHRONIZED WITH BATTLE HP
  useEffect(() => {
    if (!characterLoaded) return;

    setCharacter((previous) => {
      if (previous.currentHp === battle.playerHp) {
        return previous;
      }

      return {
        ...previous,
        currentHp: battle.playerHp,
      };
    });
  }, [battle.playerHp, characterLoaded]);

  // AWARD EXPERIENCE AFTER VICTORY
  useEffect(() => {
    if (
      battle.status !== "victory" ||
      xpAwardedRef.current
    ) {
      return;
    }

    xpAwardedRef.current = true;
    setXpAwarded(true);

    const characterAtVictory = {
      ...character,
      currentHp: battle.playerHp,
    };

    const updatedCharacter = addExperience(
      characterAtVictory,
      xpReward
    );

    setCharacter(updatedCharacter);

    if (updatedCharacter.level > character.level) {
      setBattle((previous) => ({
        ...previous,
        playerHp: updatedCharacter.currentHp,
        playerMaxHp: updatedCharacter.maxHp,
      }));

      setLevelUpMessage(
        `LEVEL UP! You are now level ${updatedCharacter.level}!`
      );
    }
  }, [
    battle.status,
    battle.playerHp,
    character,
    xpReward,
  ]);

  function selectNextPassage() {
    const availablePassages = passages.filter(
      (passage) =>
        passage.difficulty === difficulty &&
        !usedPassageIds.includes(passage.id)
    );

    const remainingPassages = passages.filter(
      (passage) =>
        !usedPassageIds.includes(passage.id)
    );

    const candidates =
      availablePassages.length > 0
        ? availablePassages
        : remainingPassages.length > 0
          ? remainingPassages
          : passages.filter(
              (passage) =>
                passage.id !== currentPassageId
            );

    if (candidates.length === 0) return;

    const nextPassage =
      candidates[
        Math.floor(Math.random() * candidates.length)
      ];

    setCurrentPassageId(nextPassage.id);

    setUsedPassageIds((previous) =>
      previous.includes(nextPassage.id)
        ? [nextPassage.id]
        : [...previous, nextPassage.id]
    );
  }

  function handleTypingComplete(result: TypingResult) {
    const isWarriorGuardActive =
      character.characterClass === "warrior" &&
      activeSkills.ironGuard;

    if (!result.completed) {
      setBattle((previous) => {
        let next = resolveFailedAttack(
          previous,
          inventory,
          character
        );

        if (
          isWarriorGuardActive &&
          next.status !== "victory"
        ) {
          const reducedDamage = calculateSkillDefense(
            next.lastEnemyDamage,
            activeSkills
          );

          const damageSaved =
            next.lastEnemyDamage - reducedDamage;

          const restoredHp = Math.min(
            next.playerMaxHp,
            next.playerHp + damageSaved
          );

          next = {
            ...next,
            playerHp: restoredHp,
            lastEnemyDamage: reducedDamage,
            status:
              restoredHp > 0 ? "player-turn" : "defeat",
            message: `Your attack failed! Iron Guard reduced the Goblin's damage to ${reducedDamage}.`,
          };
        }

        return next;
      });

      if (isWarriorGuardActive) {
        setActiveSkills((previous) => ({
          ...previous,
          ironGuard: false,
        }));
      }

      return;
    }

    setBattle((previous) => {
      let next = resolvePlayerTurn(
        previous,
        {
          wpm: result.wpm,
          accuracy: result.accuracy,
          errors: result.errors,
          rank: result.rank,
        },
        inventory,
        character
      );

      const boostedDamage = calculateSkillDamage(
        character.characterClass,
        next.lastPlayerDamage,
        result.accuracy,
        activeSkills
      );

      const bonusDamage =
        boostedDamage - next.lastPlayerDamage;

      if (bonusDamage > 0) {
        const boostedEnemyHp = Math.max(
          0,
          next.enemyHp - bonusDamage
        );

        const bonusDefeatedEnemy =
          boostedEnemyHp <= 0;

        next = {
          ...next,
          enemyHp: boostedEnemyHp,
          lastPlayerDamage: boostedDamage,
          playerHp: bonusDefeatedEnemy
            ? Math.min(
                next.playerMaxHp,
                next.playerHp + next.lastEnemyDamage
              )
            : next.playerHp,
          lastEnemyDamage: bonusDefeatedEnemy
            ? 0
            : next.lastEnemyDamage,
          status: bonusDefeatedEnemy
            ? "victory"
            : next.status,
          message: bonusDefeatedEnemy
            ? `Your class skill dealt ${boostedDamage} damage and defeated the Goblin Warrior!`
            : `Your class skill empowered your attack! You dealt ${boostedDamage} damage.`,
        };
      }

      if (
        isWarriorGuardActive &&
        next.status !== "victory"
      ) {
        const reducedDamage = calculateSkillDefense(
          next.lastEnemyDamage,
          activeSkills
        );

        const damageSaved =
          next.lastEnemyDamage - reducedDamage;

        const restoredHp = Math.min(
          next.playerMaxHp,
          next.playerHp + damageSaved
        );

        next = {
          ...next,
          playerHp: restoredHp,
          lastEnemyDamage: reducedDamage,
          status:
            restoredHp > 0 ? "player-turn" : "defeat",
          message: `${next.message} Iron Guard reduced incoming damage to ${reducedDamage}.`,
        };
      }

      return next;
    });

    if (
      character.characterClass === "mage" &&
      activeSkills.arcaneSurge
    ) {
      setActiveSkills((previous) => ({
        ...previous,
        arcaneSurge: false,
      }));
    }

    if (isWarriorGuardActive) {
      setActiveSkills((previous) => ({
        ...previous,
        ironGuard: false,
      }));
    }
  }

  function handleActivateClassSkill() {
    if (battle.status !== "player-turn") return;
    if (character.characterClass === "archer") return;

    const alreadyActive =
      character.characterClass === "warrior"
        ? activeSkills.ironGuard
        : activeSkills.arcaneSurge;

    if (alreadyActive) return;

    setActiveSkills((previous) =>
      activateClassSkill(
        character.characterClass,
        previous
      )
    );

    setBattle((previous) => ({
      ...previous,
      message: `${classSkill.name} activated! ${classSkill.description}`,
    }));
  }

  function collectReward() {
    if (rewardCollected) return;

    const restoredHp = character.maxHp;

    setCharacter((previous) => ({
      ...previous,
      currentHp: restoredHp,
    }));

    setBattle((previous) => ({
      ...previous,
      playerHp: restoredHp,
      playerMaxHp: restoredHp,
      message: "Reward claimed! Your HP has been fully restored.",
    }));

    const existingItem = inventory.items.find(
      (item) => item.id === reward.id
    );

    if (existingItem) {
      setRewardCollected(true);
      return;
    }

    const inventoryItem: InventoryItem = {
      id: reward.id,
      name: reward.name,
      description: reward.description,
      type:
        reward.type === "attack"
          ? "weapon"
          : "armor",
      quantity: 1,
      equipped: true,
    };

    setInventory((previous) =>
      addItem(previous, inventoryItem)
    );

    setRewardCollected(true);
  }

  function handleEquip(itemId: string) {
    setInventory((previous) =>
      equipItem(previous, itemId)
    );
  }

  function handleUnequip(itemId: string) {
    setInventory((previous) =>
      unequipItem(previous, itemId)
    );
  }

  function continueBattle() {
    selectNextPassage();
    setRound((previous) => previous + 1);
  }

  // START A FRESH BATTLE AND CLEAR THE PREVIOUS BATTLE SAVE
  function restartBattle() {
    const healedCharacter = {
      ...character,
      currentHp: character.maxHp,
    };

    setBattle({
      ...INITIAL_BATTLE_STATE,
      playerHp: healedCharacter.maxHp,
      playerMaxHp: healedCharacter.maxHp,
    });

    setCharacter(healedCharacter);

    setRound(0);
    setCurrentPassageId(passages[0].id);
    setUsedPassageIds([passages[0].id]);

    setRewardCollected(false);
    setXpAwarded(false);
    setLevelUpMessage("");

    setActiveSkills(INITIAL_ACTIVE_SKILLS);

    xpAwardedRef.current = false;

    const existingSave = loadGame();

    saveGame(
      healedCharacter,
      inventory,
      existingSave?.currentNodeId ?? "opening",
      existingSave?.decisions ?? {},
      null
    );
  }

  const isVictory = battle.status === "victory";
  const isDefeat = battle.status === "defeat";

  const equippedWeapon = inventory.items.find(
    (item) =>
      item.type === "weapon" && item.equipped
  );

  const equippedArmor = inventory.items.find(
    (item) =>
      item.type === "armor" && item.equipped
  );

  const experiencePercentage = Math.min(
    100,
    (character.experience /
      character.experienceToNextLevel) *
      100
  );

  const hasStoryReward = inventory.items.some(
    (item) => item.id === reward.id
  );

  if (!characterLoaded) {
    return (
      <div className="mt-8 rounded-2xl border border-amber-500/30 bg-slate-950 p-8 text-center text-white">
        <p className="font-bold text-amber-300">
          Preparing your adventure...
        </p>

        <p className="mt-2 text-sm text-slate-400">
          Loading your hero profile.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-amber-500/30 bg-slate-950 p-6 text-white shadow-2xl">

      {/* Character Profile */}
      <div className="mb-6 rounded-xl border border-purple-400/30 bg-purple-950/20 p-5">

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-300">
              Player Character
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              {character.name}
            </h2>

            <p className="text-sm capitalize text-slate-400">
              Level {character.level} {character.characterClass}
            </p>
          </div>

          <span className="rounded-lg border border-purple-400/30 bg-purple-400/10 px-4 py-2 font-bold text-purple-300">
            LVL {character.level}
          </span>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">

          <div className="rounded-lg bg-slate-900 p-3">
            <p className="text-xs text-slate-400">Max HP</p>
            <p className="mt-1 text-xl font-bold text-red-400">
              {character.maxHp}
            </p>
          </div>

          <div className="rounded-lg bg-slate-900 p-3">
            <p className="text-xs text-slate-400">Attack</p>
            <p className="mt-1 text-xl font-bold text-orange-400">
              {character.baseAttack}
            </p>
          </div>

          <div className="rounded-lg bg-slate-900 p-3">
            <p className="text-xs text-slate-400">Defense</p>
            <p className="mt-1 text-xl font-bold text-blue-400">
              {character.baseDefense}
            </p>
          </div>

          <div className="rounded-lg bg-slate-900 p-3">
            <p className="text-xs text-slate-400">Total XP</p>
            <p className="mt-1 text-xl font-bold text-amber-400">
              {character.experience}
            </p>
          </div>

        </div>

        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-amber-300">
            Experience Progress
          </span>

          <span className="text-slate-300">
            {character.experience}/{character.experienceToNextLevel} XP
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-amber-400 transition-all duration-500"
            style={{
              width: `${experiencePercentage}%`,
            }}
          />
        </div>

        <p className="mt-2 text-right text-xs text-slate-400">
          {Math.max(
            0,
            character.experienceToNextLevel -
              character.experience
          )} XP needed for next level
        </p>

      </div>

      {/* Battle Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
            Goblin Warrior Encounter
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            {storyChoice === "protect-village"
              ? "Defender's Path"
              : "Forest Explorer's Path"}
          </h2>
        </div>

        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-sm text-amber-300">
          Round {round + 1}
        </span>

      </div>

      {/* Battle HP */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">

        <div className="rounded-xl border border-blue-400/20 bg-blue-950/40 p-4">
          <div className="mb-2 flex justify-between">
            <span className="font-bold text-blue-300">
              {character.name}
            </span>

            <span>
              {battle.playerHp}/{battle.playerMaxHp} HP
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{
                width: `${
                  (battle.playerHp / battle.playerMaxHp) * 100
                }%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-red-400/20 bg-red-950/40 p-4">
          <div className="mb-2 flex justify-between">
            <span className="font-bold text-red-300">
              Goblin Warrior
            </span>

            <span>
              {battle.enemyHp}/{battle.enemyMaxHp} HP
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-red-500 transition-all"
              style={{
                width: `${
                  (battle.enemyHp / battle.enemyMaxHp) * 100
                }%`,
              }}
            />
          </div>
        </div>

      </div>

      {/* Equipment */}
      <div className="mb-6 rounded-xl border border-blue-400/20 bg-blue-950/20 p-4">

        <h3 className="mb-3 font-bold text-blue-300">
          Equipped Equipment
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">

          <div className="rounded-lg bg-slate-900 p-3">
            <p className="text-xs uppercase text-slate-400">
              Weapon
            </p>

            <p className="mt-1 font-semibold">
              {equippedWeapon?.name ?? "None"}
            </p>

            <p className="text-xs text-green-400">
              {equippedWeapon
                ? "+5 Attack"
                : "No attack bonus"}
            </p>
          </div>

          <div className="rounded-lg bg-slate-900 p-3">
            <p className="text-xs uppercase text-slate-400">
              Armor
            </p>

            <p className="mt-1 font-semibold">
              {equippedArmor?.name ?? "None"}
            </p>

            <p className="text-xs text-green-400">
              {equippedArmor
                ? "-3 Incoming Damage"
                : "No defense bonus"}
            </p>
          </div>

        </div>
      </div>

      {/* Class Skill */}
      <div className="mb-6 rounded-xl border border-purple-400/30 bg-purple-950/20 p-4">

        <div className="flex flex-wrap items-start justify-between gap-3">

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">
              Class Skill
            </p>

            <h3 className="mt-1 text-lg font-bold text-white">
              {classSkill.name}
            </h3>

            <p className="mt-1 text-sm text-slate-300">
              {classSkill.description}
            </p>
          </div>

          {character.characterClass === "archer" ? (
            <span className="rounded-lg border border-green-400/30 bg-green-400/10 px-3 py-2 text-xs font-bold uppercase text-green-300">
              Passive Skill
            </span>
          ) : (
            <button
              onClick={handleActivateClassSkill}
              disabled={
                battle.status !== "player-turn" ||
                (character.characterClass === "warrior"
                  ? activeSkills.ironGuard
                  : activeSkills.arcaneSurge)
              }
              className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-bold text-white hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {character.characterClass === "warrior"
                ? activeSkills.ironGuard
                  ? "Iron Guard Active"
                  : "Activate Skill"
                : activeSkills.arcaneSurge
                  ? "Arcane Surge Active"
                  : "Activate Skill"}
            </button>
          )}

        </div>

        {character.characterClass === "archer" ? (
          <p className="mt-3 text-xs text-green-300">
            Automatically adds 30% damage when your typing accuracy is 95% or higher.
          </p>
        ) : (
          <p className="mt-3 text-xs text-purple-200">
            {character.characterClass === "warrior"
              ? activeSkills.ironGuard
                ? "Ready: your next incoming enemy attack will be reduced by 50%."
                : "Activate before the Goblin retaliates to reduce its next attack."
              : activeSkills.arcaneSurge
                ? "Ready: your next completed typing attack will deal 50% more damage."
                : "Activate before typing to empower your next successful attack."}
          </p>
        )}

      </div>

      {/* Story Reward */}
      <div className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-950/30 p-4">

        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
          Story Reward
        </p>

        <h3 className="mt-1 text-lg font-bold">
          {reward.name}
        </h3>

        <p className="mt-1 text-sm text-slate-300">
          {reward.description}
        </p>

      </div>

      {/* Typing Passage */}
      <div className="mb-6 rounded-xl border border-slate-700 bg-slate-900 p-4">

        <p className="text-sm font-semibold text-amber-300">
          {currentPassage.title}
        </p>

        <p className="mt-1 text-sm text-slate-400">
          {currentPassage.description}
        </p>

        <span className="mt-3 inline-block rounded-full bg-slate-800 px-3 py-1 text-xs uppercase text-amber-200">
          {currentPassage.difficulty}
        </span>

      </div>

      {/* Combat Log */}
      <div className="mb-6 rounded-xl border border-slate-700 bg-slate-900/70 p-4">

        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Combat Log
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-200">
          {battle.message}
        </p>

        {(battle.lastPlayerDamage > 0 ||
          battle.lastEnemyDamage > 0) && (
          <div className="mt-3 flex flex-wrap gap-4 text-sm">

            <span className="text-green-400">
              Player damage: {battle.lastPlayerDamage}
            </span>

            <span className="text-red-400">
              Enemy damage: {battle.lastEnemyDamage}
            </span>

          </div>
        )}

      </div>

      {/* Victory */}
      {isVictory ? (
        <div className="rounded-xl border border-green-400/30 bg-green-950/30 p-6 text-center">

          <h3 className="text-3xl font-black text-green-400">
            VICTORY!
          </h3>

          <p className="mt-2 text-slate-200">
            You defeated the Goblin Warrior!
          </p>

          {/* XP Reward */}
          <div className="mt-5 rounded-xl border border-purple-400/30 bg-purple-950/30 p-4">

            <p className="text-sm font-semibold uppercase tracking-wider text-purple-300">
              Experience Earned
            </p>

            <p className="mt-2 text-4xl font-black text-amber-400">
              +{xpReward} XP
            </p>

            {xpAwarded && (
              <p className="mt-2 text-sm text-green-300">
                Experience successfully added!
              </p>
            )}

            {levelUpMessage && (
              <div className="mt-4 rounded-lg border border-amber-400/40 bg-amber-400/10 p-4">

                <p className="text-xl font-black text-amber-300">
                  {levelUpMessage}
                </p>

                <p className="mt-2 text-sm text-slate-200">
                  Your maximum HP, attack, and defense have increased!
                </p>

              </div>
            )}

          </div>

          {/* Story Reward Collection */}
          <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-950/30 p-4">

            <p className="font-bold text-amber-300">
              {reward.name}
            </p>

            <p className="mt-1 text-sm text-slate-300">
              {reward.description}
            </p>

            {!rewardCollected ? (
              <button
                onClick={collectReward}
                className="mt-4 rounded-lg bg-amber-500 px-6 py-3 font-bold text-slate-950 hover:bg-amber-400"
              >
                {hasStoryReward
                  ? "Already in Inventory"
                  : "Collect Reward"}
              </button>
            ) : (
              <p className="mt-4 font-bold text-green-400">
                Story reward already collected!
              </p>
            )}

          </div>

          <button
            onClick={restartBattle}
            className="mt-5 rounded-lg bg-slate-700 px-6 py-3 font-bold text-white hover:bg-slate-600"
          >
            Fight Again
          </button>

        </div>
      ) : isDefeat ? (

        <div className="rounded-xl border border-red-400/30 bg-red-950/30 p-6 text-center">

          <h3 className="text-3xl font-black text-red-400">
            DEFEAT
          </h3>

          <p className="mt-2 text-slate-200">
            The Goblin Warrior has defeated you.
          </p>

          <button
            onClick={restartBattle}
            className="mt-5 rounded-lg bg-red-500 px-6 py-3 font-bold text-white hover:bg-red-400"
          >
            Try Again
          </button>

        </div>

      ) : (

        <>
          <div className="mb-4">

            <p className="mb-2 text-sm font-semibold text-amber-300">
              {character.characterClass === "warrior"
                ? "Warrior Combat Challenge"
                : character.characterClass === "mage"
                  ? "Mage Spell Challenge"
                  : "Archer Precision Challenge"}
            </p>

            <p className="mb-3 text-xs text-slate-400">
              Type the passage accurately. Your accuracy and WPM determine your damage.
            </p>

            <TypingEngine
              key={`${character.characterClass}-${round}-${currentPassage.id}`}
              passage={classTypingPassage}
              duration={60}
              onComplete={handleTypingComplete}
            />

          </div>

          {(battle.lastPlayerDamage > 0 ||
            battle.lastEnemyDamage > 0) && (
            <button
              onClick={continueBattle}
              className="mt-4 w-full rounded-lg bg-amber-500 px-6 py-3 font-bold text-slate-950 hover:bg-amber-400"
            >
              Continue Battle
            </button>
          )}

        </>
      )}

      {/* Inventory */}
      <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-4">

        <div className="mb-3 flex items-center justify-between">

          <h3 className="font-bold text-amber-300">
            Player Inventory
          </h3>

          <span className="text-xs text-slate-400">
            {inventory.items.length} items
          </span>

        </div>

        {inventory.items.length === 0 ? (

          <p className="text-sm text-slate-500">
            Your inventory is empty.
          </p>

        ) : (

          <div className="space-y-2">

            {inventory.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-800 p-3"
              >

                <div>
                  <p className="font-semibold">
                    {item.name}
                  </p>

                  <p className="text-xs text-slate-400">
                    {item.description}
                  </p>

                  <p className="mt-1 text-xs text-amber-300">
                    {item.equipped
                      ? "Equipped"
                      : "Unequipped"}
                  </p>
                </div>

                {item.equipped ? (

                  <button
                    onClick={() => handleUnequip(item.id)}
                    className="rounded-lg bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/30"
                  >
                    Unequip
                  </button>

                ) : (

                  <button
                    onClick={() => handleEquip(item.id)}
                    className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30"
                  >
                    Equip
                  </button>

                )}

              </div>
            ))}

          </div>

        )}

      </div>

    </div>
  );
}
