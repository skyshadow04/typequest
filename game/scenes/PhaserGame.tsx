
"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";

import BootScene from "@/game/scenes/BootScene";
import BattleScene from "@/game/scenes/BattleScene";

type PlayerClass = "warrior" | "archer" | "mage";

type PhaserGameProps = {
  playerClass?: PlayerClass;
  onSceneReady?: (scene: BattleScene | null) => void;
};

export default function PhaserGame({
  playerClass = "warrior",
  onSceneReady,
}: PhaserGameProps) {
  const gameContainer = useRef<HTMLDivElement>(null);

  const playerClassRef = useRef(playerClass);
  const onSceneReadyRef = useRef(onSceneReady);

  // Keep the latest props available without recreating Phaser.
  playerClassRef.current = playerClass;
  onSceneReadyRef.current = onSceneReady;

  useEffect(() => {
    const container = gameContainer.current;

    if (!container) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      width: 800,
      height: 450,
      backgroundColor: "#171629",
      pixelArt: true,
      roundPixels: true,
      scene: [BootScene, BattleScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });

    game.registry.set(
      "playerClass",
      playerClassRef.current
    );

    const handleSceneReady = (scene: BattleScene) => {
      onSceneReadyRef.current?.(scene);
    };

    game.events.on(
      "battle-scene-ready",
      handleSceneReady
    );

    return () => {
      game.events.off(
        "battle-scene-ready",
        handleSceneReady
      );

      onSceneReadyRef.current?.(null);

      game.destroy(true);
    };
  }, []);

  return (
    <div className="w-full overflow-hidden">
      <div
        ref={gameContainer}
        className="w-full overflow-hidden"
        style={{
          aspectRatio: "16 / 9",
        }}
      />
    </div>
  );
}
