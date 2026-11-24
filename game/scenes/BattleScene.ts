
import Phaser from "phaser";

type PlayerClass = "warrior" | "archer" | "mage";

type BattleActionCallback = () => void;

export default class BattleScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private enemy!: Phaser.GameObjects.Sprite;

  private playerShadow!: Phaser.GameObjects.Ellipse;
  private enemyShadow!: Phaser.GameObjects.Ellipse;

  private playerStartX = 0;
  private enemyStartX = 0;

  private playerClass: PlayerClass = "warrior";

  private isAttacking = false;
  private isPlayerDead = false;
  private isEnemyDead = false;

  private playerAttackDamage = 0;
  private enemyAttackDamage = 0;

  private playerAttackCallback?: BattleActionCallback;
  private enemyAttackCallback?: BattleActionCallback;

  private playerBreathingTween?: Phaser.Tweens.Tween;
  private enemyBreathingTween?: Phaser.Tweens.Tween;

  private readonly playerScale = 0.65;
  private readonly enemyScale = 0.55;

  private get playerPrefix() {
    return {
      warrior: "knight",
      archer: "archer",
      mage: "mage",
    }[this.playerClass];
  }

  private get playerAnimations() {
    return {
      warrior: {
        idle: "knight-idle",
        walk: "knight-walk",
        attack: "knight-attack",
        hurt: "knight-hurt",
        death: "knight-death",
      },
      archer: {
        idle: "archer-idle",
        walk: "archer-walk",
        attack: "archer-attack",
        hurt: "archer-hurt",
        death: "archer-hurt",
      },
      mage: {
        idle: "mage-idle",
        walk: "mage-walk",
        attack: "mage-attack",
        hurt: "mage-hurt",
        death: "mage-hurt",
      },
    }[this.playerClass];
  }

  constructor() {
    super("BattleScene");
  }

  // --------------------------------------------------
  // PLAYER CLASS
  // --------------------------------------------------

  private resolvePlayerClass(): PlayerClass {
    const registeredClass = this.registry.get("playerClass");

    if (
      registeredClass === "warrior" ||
      registeredClass === "archer" ||
      registeredClass === "mage"
    ) {
      return registeredClass;
    }

    if (typeof window !== "undefined") {
      try {
        const savedCharacter = localStorage.getItem(
          "typequest-character"
        );

        if (savedCharacter) {
          const character = JSON.parse(savedCharacter);

          const savedClass =
            character.class ??
            character.characterClass ??
            character.playerClass;

          if (
            savedClass === "warrior" ||
            savedClass === "archer" ||
            savedClass === "mage"
          ) {
            return savedClass;
          }
        }
      } catch (error) {
        console.warn("Could not read saved character class:", error);
      }
    }

    return "warrior";
  }

  public setPlayerClass(playerClass: PlayerClass) {
    this.registry.set("playerClass", playerClass);
    this.playerClass = playerClass;
  }

  // --------------------------------------------------
  // CONTROLLED COMBAT API
  // --------------------------------------------------

  /**
   * React calls this after BattleEngine resolves a successful
   * player typing attack.
   *
   * Phaser displays the supplied damage but does not calculate it.
   */
  public playPlayerAttack(
    damage: number,
    onComplete?: BattleActionCallback
  ) {
    if (
    !this.player ||
    !this.enemy ||
    this.isAttacking ||
    this.isPlayerDead ||
    this.isEnemyDead
    ) {
    onComplete?.();
    return;
    }

    this.playerAttackDamage = Math.max(0, damage);
    this.playerAttackCallback = onComplete;

    this.performAttack();
  }

  /**
   * React calls this only when BattleEngine determines that
   * the Goblin retaliates.
   */
  public playEnemyAttack(
    damage: number,
    onComplete?: BattleActionCallback
  ) {
    if (
    !this.player ||
    !this.enemy ||
    this.isAttacking ||
    this.isPlayerDead ||
    this.isEnemyDead
    ) {
    onComplete?.();
    return;
    }

    this.enemyAttackDamage = Math.max(0, damage);
    this.enemyAttackCallback = onComplete;

    this.isAttacking = true;

    this.pauseBreathing(this.player);
    this.pauseBreathing(this.enemy);

    this.performGoblinRetaliation();
  }

  /**
   * Restores the visual battle state after React restarts
   * or restores a battle.
   */
  public resetBattle() {
    if (!this.player || !this.enemy) return;

    this.tweens.killTweensOf(this.player);
    this.tweens.killTweensOf(this.enemy);

    this.isAttacking = false;
    this.isPlayerDead = false;
    this.isEnemyDead = false;

    this.playerAttackDamage = 0;
    this.enemyAttackDamage = 0;

    this.playerAttackCallback = undefined;
    this.enemyAttackCallback = undefined;

    this.player.setPosition(
      this.playerStartX,
      this.player.y
    );

    this.enemy.setPosition(
      this.enemyStartX,
      this.enemy.y
    );

    this.player.setScale(this.playerScale);
    this.enemy.setScale(this.enemyScale);

    this.player.setAlpha(1);
    this.enemy.setAlpha(1);

    this.player.clearTint();
    this.enemy.clearTint();

    this.player.play(this.playerAnimations.idle);
    this.enemy.play("goblin-idle");

    this.playerBreathingTween?.remove();
    this.enemyBreathingTween?.remove();

    this.startIdleBreathing(this.player, 0);
    this.startIdleBreathing(this.enemy, 500);
  }

  // --------------------------------------------------
  // PRELOAD
  // --------------------------------------------------

  preload() {
    const knightPath = "/assets/characters/warrior/moss-knight/";
    const archerPath = "/assets/characters/archer/forest-archer/";
    const magePath = "/assets/characters/mage/cozy-witch/";
    const goblinPath = "/assets/enemies/goblin/";

    this.load.image(
      "forest-battle",
      "/assets/backgrounds/forest-battle.png"
    );

    // Warrior
    [
      "idle",
      "walk",
      "attack",
      "hurt",
      "death",
      "jump",
      "roll",
    ].forEach((animation) => {
      this.load.atlas(
        `knight-${animation}`,
        `${knightPath}moss-knight-${animation}.png`,
        `${knightPath}moss-knight-${animation}.json`
      );
    });

    // Archer
    [
      "idle",
      "run",
      "shoot",
      "hurt",
      "dodge",
    ].forEach((animation) => {
      this.load.atlas(
        `archer-${animation}`,
        `${archerPath}forest-archer-${animation}.png`,
        `${archerPath}forest-archer-${animation}.json`
      );
    });

    // Mage
    [
      "idle",
      "walk",
      "cast",
      "hurt",
      "brew",
    ].forEach((animation) => {
      this.load.atlas(
        `mage-${animation}`,
        `${magePath}cozy-witch-${animation}.png`,
        `${magePath}cozy-witch-${animation}.json`
      );
    });

    // Goblin
    [
      "idle",
      "walk",
      "attack",
      "hurt",
      "death",
    ].forEach((animation) => {
      this.load.atlas(
        `goblin-${animation}`,
        `${goblinPath}goblin-${animation}.png`,
        `${goblinPath}goblin-${animation}.json`
      );
    });
  }

  // --------------------------------------------------
  // CREATE
  // --------------------------------------------------

  create() {
    const { width, height } = this.scale;

    this.playerClass = this.resolvePlayerClass();

    this.cameras.main.setBackgroundColor("#171629");

    this.add.image(
      width / 2,
      height / 2 - 70,
      "forest-battle"
    )
      .setDisplaySize(width, height)
      .setDepth(-10);

    this.createEnvironmentalLighting(width, height);
    this.createDustParticles(width, height);
    this.createFireflies(width, height);
    this.createForestFog(width, height);
    this.createForestDetails(width, height);
    this.createFallingLeaves(width, height);
    this.createForegroundFoliage(width, height);
    this.createVignette(width, height);

    this.add.text(width / 2, 30, "BATTLE SCENE", {
      fontSize: "24px",
      color: "#fbbf24",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(20);

    const classNames: Record<PlayerClass, string> = {
      warrior: "WARRIOR",
      archer: "ARCHER",
      mage: "MAGE",
    };

    this.add.text(
      width * 0.25,
      height - 50,
      classNames[this.playerClass],
      {
        fontSize: "16px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#171629",
        strokeThickness: 4,
      }
    ).setOrigin(0.5).setDepth(20);

    this.add.text(width * 0.75, height - 50, "GOBLIN", {
      fontSize: "16px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#171629",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20);

    this.createPlayerAnimations();
    this.createGoblinAnimations();

    // Player
    this.player = this.add.sprite(
      width * 0.25,
      height - 95,
      `${this.playerPrefix}-idle`
    );

    this.player.setOrigin(0.5, 1);
    this.player.setScale(this.playerScale);
    this.player.setDepth(2);
    this.player.play(this.playerAnimations.idle);

    // Goblin
    this.enemy = this.add.sprite(
      width * 0.75,
      height - 95,
      "goblin-idle"
    );

    this.enemy.setOrigin(0.5, 1);
    this.enemy.setScale(this.enemyScale);
    this.enemy.setDepth(2);
    this.enemy.play("goblin-idle");

    this.playerStartX = this.player.x;
    this.enemyStartX = this.enemy.x;

    this.playerShadow = this.add.ellipse(
      this.player.x,
      this.player.y - 2,
      65,
      14,
      0x000000,
      0.4
    ).setDepth(1);

    this.enemyShadow = this.add.ellipse(
      this.enemy.x,
      this.enemy.y - 2,
      75,
      15,
      0x000000,
      0.35
    ).setDepth(1);

    this.startIdleBreathing(this.player, 0);
    this.startIdleBreathing(this.enemy, 500);

    // No pointer-to-attack handler here.
    // React now controls every combat action.

    console.log(`BattleScene loaded: ${this.playerClass}`);

    // Notify PhaserGame.tsx that this scene is ready.
    this.game.events.emit("battle-scene-ready", this);
  }

  // --------------------------------------------------
  // PLAYER ANIMATIONS
  // --------------------------------------------------

  private createPlayerAnimations() {
    // Warrior
    this.createAtlasAnimation(
      "knight-idle",
      "knight-idle",
      "moss-knight-idle-",
      8,
      -1
    );

    this.createAtlasAnimation(
      "knight-walk",
      "knight-walk",
      "moss-knight-walk-",
      12,
      -1
    );

    this.createAtlasAnimation(
      "knight-attack",
      "knight-attack",
      "moss-knight-attack-",
      12,
      0
    );

    this.createAtlasAnimation(
      "knight-hurt",
      "knight-hurt",
      "moss-knight-hurt-",
      18,
      0
    );

    this.createAtlasAnimation(
      "knight-death",
      "knight-death",
      "moss-knight-death-",
      12,
      0
    );

    // Archer
    this.createAtlasAnimation(
      "archer-idle",
      "archer-idle",
      "forest-archer-idle-",
      8,
      -1
    );

    this.createAtlasAnimation(
      "archer-run",
      "archer-walk",
      "forest-archer-run-",
      12,
      -1
    );

    this.createAtlasAnimation(
      "archer-shoot",
      "archer-attack",
      "forest-archer-shoot-",
      12,
      0
    );

    this.createAtlasAnimation(
      "archer-hurt",
      "archer-hurt",
      "forest-archer-hurt-",
      18,
      0
    );

    // Mage
    this.createAtlasAnimation(
      "mage-idle",
      "mage-idle",
      "cozy-witch-idle-",
      8,
      -1
    );

    this.createAtlasAnimation(
      "mage-walk",
      "mage-walk",
      "cozy-witch-walk-",
      12,
      -1
    );

    this.createAtlasAnimation(
      "mage-cast",
      "mage-attack",
      "cozy-witch-cast-",
      12,
      0
    );

    this.createAtlasAnimation(
      "mage-hurt",
      "mage-hurt",
      "cozy-witch-hurt-",
      18,
      0
    );
  }

  // --------------------------------------------------
  // GOBLIN ANIMATIONS
  // --------------------------------------------------

  private createGoblinAnimations() {
    this.createAtlasAnimation(
      "goblin-idle",
      "goblin-idle",
      "goblin-idle-",
      5,
      -1
    );

    this.createAtlasAnimation(
      "goblin-walk",
      "goblin-walk",
      "goblin-walk-",
      12,
      -1
    );

    this.createAtlasAnimation(
      "goblin-attack",
      "goblin-attack",
      "goblin-attack-",
      16,
      0
    );

    this.createAtlasAnimation(
      "goblin-hurt",
      "goblin-hurt",
      "goblin-hurt-",
      18,
      0
    );

    this.createAtlasAnimation(
      "goblin-death",
      "goblin-death",
      "goblin-death-",
      12,
      0
    );
  }

  // --------------------------------------------------
  // ENVIRONMENTAL LIGHTING
  // --------------------------------------------------

  private createEnvironmentalLighting(width: number, height: number) {
    const moonGlowOuter = this.add.circle(
      width * 0.78,
      height * 0.13,
      125,
      0x9ecfff,
      0.045
    );

    moonGlowOuter.setDepth(-9);
    moonGlowOuter.setBlendMode(Phaser.BlendModes.SCREEN);

    const moonGlowInner = this.add.circle(
      width * 0.78,
      height * 0.13,
      75,
      0xc8e5ff,
      0.055
    );

    moonGlowInner.setDepth(-8.9);
    moonGlowInner.setBlendMode(Phaser.BlendModes.SCREEN);

    this.tweens.add({
      targets: [moonGlowOuter, moonGlowInner],
      alpha: 0.025,
      duration: 5000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const rays = [
      {
        x: width * 0.58,
        y: height * 0.36,
        rayWidth: 65,
        rayHeight: height * 0.75,
        rotation: -0.22,
        alpha: 0.045,
        duration: 6500,
      },
      {
        x: width * 0.72,
        y: height * 0.34,
        rayWidth: 85,
        rayHeight: height * 0.85,
        rotation: 0.12,
        alpha: 0.055,
        duration: 8000,
      },
      {
        x: width * 0.85,
        y: height * 0.38,
        rayWidth: 55,
        rayHeight: height * 0.7,
        rotation: 0.25,
        alpha: 0.035,
        duration: 7200,
      },
    ];

    rays.forEach((ray, index) => {
      const lightRay = this.add.triangle(
        ray.x,
        ray.y,
        -ray.rayWidth / 2,
        -ray.rayHeight / 2,
        ray.rayWidth / 2,
        -ray.rayHeight / 2,
        0,
        ray.rayHeight / 2,
        0xc5e4ff,
        ray.alpha
      );

      lightRay.setRotation(ray.rotation);
      lightRay.setDepth(-8);
      lightRay.setBlendMode(Phaser.BlendModes.SCREEN);

      this.tweens.add({
        targets: lightRay,
        alpha: ray.alpha * 0.35,
        rotation: ray.rotation + (index % 2 === 0 ? 0.035 : -0.035),
        duration: ray.duration,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    const battlefieldGlow = this.add.ellipse(
      width / 2,
      height * 0.72,
      width * 0.75,
      height * 0.45,
      0x8ab7a0,
      0.045
    );

    battlefieldGlow.setDepth(-7);
    battlefieldGlow.setBlendMode(Phaser.BlendModes.SCREEN);

    this.tweens.add({
      targets: battlefieldGlow,
      alpha: 0.075,
      scaleX: 1.08,
      scaleY: 1.05,
      duration: 4500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  // --------------------------------------------------
  // VIGNETTE
  // --------------------------------------------------

  private createVignette(width: number, height: number) {
    const graphics = this.add.graphics();
    graphics.setDepth(15);

    graphics.fillStyle(0x080d16, 0.16);
    graphics.fillRect(0, 0, 18, height);

    graphics.fillStyle(0x080d16, 0.10);
    graphics.fillRect(18, 0, 22, height);

    graphics.fillStyle(0x080d16, 0.16);
    graphics.fillRect(width - 18, 0, 18, height);

    graphics.fillStyle(0x080d16, 0.10);
    graphics.fillRect(width - 40, 0, 22, height);

    graphics.fillStyle(0x080d16, 0.12);
    graphics.fillRect(0, 0, width, 15);

    graphics.fillStyle(0x080d16, 0.07);
    graphics.fillRect(0, 15, width, 15);

    graphics.fillStyle(0x080d16, 0.12);
    graphics.fillRect(0, height - 15, width, 15);

    graphics.fillStyle(0x080d16, 0.07);
    graphics.fillRect(0, height - 30, width, 15);
  }

  // --------------------------------------------------
  // DUST PARTICLES
  // --------------------------------------------------

  private createDustParticles(width: number, height: number) {
    for (let i = 0; i < 24; i++) {
      const x = Phaser.Math.Between(10, width - 10);
      const y = Phaser.Math.Between(40, height - 80);
      const size = Phaser.Math.FloatBetween(1, 2.2);

      const dust = this.add.circle(
        x,
        y,
        size,
        0xd8e8c6,
        Phaser.Math.FloatBetween(0.15, 0.35)
      );

      dust.setDepth(-3);

      this.tweens.add({
        targets: dust,
        x: x + Phaser.Math.Between(-35, 35),
        y: y + Phaser.Math.Between(-30, 30),
        alpha: 0.05,
        duration: Phaser.Math.Between(3500, 7000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2500),
        ease: "Sine.easeInOut",
      });
    }
  }

  // --------------------------------------------------
  // GLOWING MUSHROOMS
  // --------------------------------------------------

  private createForestDetails(width: number, height: number) {
    const positions = [
      width * 0.07,
      width * 0.18,
      width * 0.88,
      width * 0.95,
    ];

    positions.forEach((x, index) => {
      const y = height - Phaser.Math.Between(22, 32);
      const mushroom = this.add.container(x, y);

      mushroom.setDepth(0.8);

      const glow = this.add.circle(0, -8, 23, 0x8ce7b5, 0.10);
      glow.setBlendMode(Phaser.BlendModes.SCREEN);

      const stem = this.add.rectangle(0, -5, 7, 13, 0xd8d4ae, 0.95);

      const cap = this.add.ellipse(
        0,
        -13,
        22,
        12,
        index % 2 === 0 ? 0x91c96b : 0x74b9a0,
        0.95
      );

      const spot1 = this.add.circle(-5, -15, 2, 0xe8f6ce, 0.9);
      const spot2 = this.add.circle(5, -13, 2, 0xe8f6ce, 0.9);

      mushroom.add([glow, stem, cap, spot1, spot2]);

      this.tweens.add({
        targets: glow,
        alpha: 0.22,
        scale: 1.25,
        duration: 2200 + index * 300,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }

  // --------------------------------------------------
  // FIREFLIES
  // --------------------------------------------------

  private createFireflies(width: number, height: number) {
    for (let i = 0; i < 14; i++) {
      const x = Phaser.Math.Between(30, width - 30);
      const y = Phaser.Math.Between(70, Math.floor(height * 0.75));
      const size = Phaser.Math.FloatBetween(2, 3.5);

      const glow = this.add.circle(x, y, size * 3, 0xfff3a1, 0.12);
      glow.setDepth(-5);

      const core = this.add.circle(x, y, size, 0xfff7c2, 0.8);
      core.setDepth(-4);

      this.tweens.add({
        targets: [glow, core],
        x: x + Phaser.Math.Between(-35, 35),
        y: y + Phaser.Math.Between(-25, 25),
        alpha: 0.15,
        duration: Phaser.Math.Between(1800, 3500),
        delay: Phaser.Math.Between(0, 2500),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  // --------------------------------------------------
  // FOREST FOG
  // --------------------------------------------------

  private createForestFog(width: number, height: number) {
    const fogLayers = [
      {
        x: width * 0.2,
        y: height - 125,
        width: width * 0.8,
        height: 65,
        alpha: 0.20,
        duration: 10000,
      },
      {
        x: width * 0.75,
        y: height - 105,
        width: width * 0.9,
        height: 80,
        alpha: 0.16,
        duration: 14000,
      },
      {
        x: width * 0.45,
        y: height - 150,
        width: width * 0.7,
        height: 55,
        alpha: 0.18,
        duration: 12000,
      },
      {
        x: width * 0.1,
        y: height - 85,
        width: width * 0.65,
        height: 45,
        alpha: 0.14,
        duration: 16000,
      },
    ];

    fogLayers.forEach((layer, index) => {
      const fog = this.add.ellipse(
        layer.x,
        layer.y,
        layer.width,
        layer.height,
        0xdcebdc,
        layer.alpha
      );

      fog.setDepth(0);
      fog.setBlendMode(Phaser.BlendModes.SCREEN);

      this.tweens.add({
        targets: fog,
        x: layer.x + (index % 2 === 0 ? 120 : -120),
        alpha: layer.alpha * 0.5,
        duration: layer.duration,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }

  // --------------------------------------------------
  // FALLING LEAVES
  // --------------------------------------------------

  private createFallingLeaves(width: number, height: number) {
    for (let i = 0; i < 10; i++) {
      this.spawnLeaf(
        Phaser.Math.Between(20, width - 20),
        Phaser.Math.Between(0, height),
        height
      );
    }

    this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => {
        this.spawnLeaf(
          Phaser.Math.Between(0, width),
          Phaser.Math.Between(50, height + 70),
          height + 70
        );
      },
    });
  }

  private spawnLeaf(x: number, y: number, height: number) {
    const leafColors = [
      0x789344,
      0x9eaa45,
      0xc28b38,
      0xd6a64b,
      0x8c9d43,
    ];

    const color = Phaser.Utils.Array.GetRandom(leafColors);
    const leafWidth = Phaser.Math.FloatBetween(5, 9);
    const leafHeight = Phaser.Math.FloatBetween(11, 17);

    const container = this.add.container(x, y);
    container.setDepth(0.5);

    const leaf = this.add.ellipse(
      0,
      0,
      leafWidth,
      leafHeight,
      color,
      0.95
    );

    const vein = this.add.line(
      0,
      0,
      0,
      -leafHeight * 0.35,
      0,
      leafHeight * 0.35,
      0xf0d98a,
      0.65
    );

    container.add([leaf, vein]);

    const fallDuration = Phaser.Math.Between(6500, 11000);
    const driftX = Phaser.Math.Between(-100, 100);
    const rotation = Phaser.Math.Between(180, 540);
    const direction = Math.random() > 0.5 ? 1 : -1;

    container.setRotation(
      Phaser.Math.FloatBetween(-Math.PI, Math.PI)
    );

    container.setScale(
      Phaser.Math.FloatBetween(0.7, 1.2)
    );

    container.setAlpha(
      Phaser.Math.FloatBetween(0.65, 0.95)
    );

    this.tweens.add({
      targets: container,
      x: x + driftX,
      y: height + 40,
      rotation:
        container.rotation +
        Phaser.Math.DegToRad(rotation * direction),
      duration: fallDuration,
      ease: "Sine.easeInOut",
      onComplete: () => container.destroy(),
    });
  }

  // --------------------------------------------------
  // FOREGROUND FOLIAGE
  // --------------------------------------------------

  private createForegroundFoliage(width: number, height: number) {
    const positions = [
      width * 0.04,
      width * 0.14,
      width * 0.31,
      width * 0.43,
      width * 0.57,
      width * 0.68,
      width * 0.85,
      width * 0.96,
    ];

    positions.forEach((x, index) => {
      const y = height - Phaser.Math.Between(8, 18);
      const plant = this.add.container(x, y);

      plant.setDepth(1.5);

      const bushColors = [
        0x405f32,
        0x55783a,
        0x6d8742,
      ];

      for (let i = 0; i < 5; i++) {
        const bush = this.add.ellipse(
          Phaser.Math.Between(-18, 18),
          Phaser.Math.Between(-12, 0),
          Phaser.Math.Between(15, 25),
          Phaser.Math.Between(10, 17),
          Phaser.Utils.Array.GetRandom(bushColors),
          0.95
        );

        plant.add(bush);
      }

      for (let i = 0; i < 7; i++) {
        const bladeX = Phaser.Math.Between(-22, 22);
        const bladeHeight = Phaser.Math.Between(15, 32);
        const bladeWidth = Phaser.Math.Between(-12, 12);

        const bladeColor = Phaser.Utils.Array.GetRandom([
          0x789344,
          0x8da84c,
          0x526f35,
          0xa0a94c,
        ]);

        const blade = this.add.line(
          0,
          0,
          bladeX,
          0,
          bladeX + bladeWidth,
          -bladeHeight,
          bladeColor,
          0.95
        );

        blade.setLineWidth(2);
        plant.add(blade);
      }

      if (index % 2 === 0) {
        for (let i = 0; i < 3; i++) {
          const leaf = this.add.ellipse(
            Phaser.Math.Between(-12, 12),
            Phaser.Math.Between(-22, -12),
            7,
            15,
            0x91a94e,
            0.9
          );

          leaf.setRotation(
            Phaser.Math.FloatBetween(-0.8, 0.8)
          );

          plant.add(leaf);
        }
      }

      this.tweens.add({
        targets: plant,
        angle: index % 2 === 0 ? 2 : -2,
        duration: Phaser.Math.Between(1800, 2800),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: index * 120,
      });
    });
  }

  // --------------------------------------------------
  // SHADOW UPDATE
  // --------------------------------------------------

  update() {
    if (!this.player || !this.enemy) return;

    this.playerShadow.x = this.player.x;
    this.enemyShadow.x = this.enemy.x;
  }

  // --------------------------------------------------
  // IDLE BREATHING
  // --------------------------------------------------

  private startIdleBreathing(
    sprite: Phaser.GameObjects.Sprite,
    delay: number
  ) {
    const originalY = sprite.y;

    const tween = this.tweens.add({
      targets: sprite,
      y: originalY - 2,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      delay,
      ease: "Sine.easeInOut",
    });

    if (sprite === this.player) {
      this.playerBreathingTween = tween;
    } else {
      this.enemyBreathingTween = tween;
    }
  }

  private pauseBreathing(sprite: Phaser.GameObjects.Sprite) {
    if (sprite === this.player) {
      this.playerBreathingTween?.pause();
    } else {
      this.enemyBreathingTween?.pause();
    }
  }

  private resumeBreathing(sprite: Phaser.GameObjects.Sprite) {
    if (sprite === this.player) {
      this.playerBreathingTween?.resume();
    } else {
      this.enemyBreathingTween?.resume();
    }
  }

  // --------------------------------------------------
  // ANTICIPATION
  // --------------------------------------------------

  private playAnticipation(
    sprite: Phaser.GameObjects.Sprite,
    direction: number,
    onComplete: () => void
  ) {
    const originalX = sprite.x;
    const originalY = sprite.y;

    this.tweens.add({
      targets: sprite,
      x: originalX - direction * 18,
      y: originalY + 7,
      duration: 160,
      ease: "Sine.easeOut",
      yoyo: true,

      onComplete: () => {
        sprite.setPosition(originalX, originalY);
        onComplete();
      },
    });
  }

  // --------------------------------------------------
  // PLAYER ATTACK
  // --------------------------------------------------

  private performAttack() {
    if (
      this.isAttacking ||
      this.isPlayerDead ||
      this.isEnemyDead
    ) {
      return;
    }

    this.isAttacking = true;

    this.pauseBreathing(this.player);
    this.pauseBreathing(this.enemy);

    if (this.playerClass === "warrior") {
      this.performWarriorAttack();
    } else {
      this.performRangedAttack();
    }
  }

  // --------------------------------------------------
  // WARRIOR SWORD ATTACK
  // --------------------------------------------------

  private performWarriorAttack() {
    this.playAnticipation(this.player, 1, () => {
      this.player.play("knight-walk");

      const targetX = this.enemy.x - 115;

      this.tweens.add({
        targets: this.player,
        x: targetX,
        duration: 400,
        ease: "Power2",

        onComplete: () => {
          this.player.play("knight-attack");

          this.showSlash(
            this.enemy.x - 25,
            this.enemy.y - 95,
            0xffe08a
          );

          this.showImpact(
            this.enemy,
            0xffe08a,
            this.playerAttackDamage,
            1
          );

          this.enemy.play("goblin-hurt");

          this.enemy.once(
            Phaser.Animations.Events.ANIMATION_COMPLETE,
            (animation: Phaser.Animations.Animation) => {
              if (animation.key === "goblin-hurt") {
                this.enemy.play("goblin-idle");
              }
            }
          );

          this.player.once(
            Phaser.Animations.Events.ANIMATION_COMPLETE,
            (animation: Phaser.Animations.Animation) => {
              if (animation.key === "knight-attack") {
                this.playAttackRecovery();
              }
            }
          );
        },
      });
    });
  }

  // --------------------------------------------------
  // ARCHER AND MAGE RANGED ATTACKS
  // --------------------------------------------------

  private performRangedAttack() {
    const attackAnimation = this.playerAnimations.attack;

    this.playAnticipation(this.player, 1, () => {
      this.player.play(attackAnimation);

      let attackAnimationFinished = false;
      let projectileFinished = false;

      const finishAttack = () => {
        if (
          attackAnimationFinished &&
          projectileFinished
        ) {
          this.finishPlayerAttack();
        }
      };

      this.player.once(
        Phaser.Animations.Events.ANIMATION_COMPLETE,
        (animation: Phaser.Animations.Animation) => {
          if (animation.key === attackAnimation) {
            attackAnimationFinished = true;
            finishAttack();
          }
        }
      );

      this.createRangedProjectile(() => {
        this.showImpact(
          this.enemy,
          this.playerClass === "archer" ? 0x9be7a5 : 0xb68aff,
          this.playerAttackDamage,
          1
        );

        this.enemy.play("goblin-hurt");

        this.enemy.once(
          Phaser.Animations.Events.ANIMATION_COMPLETE,
          (animation: Phaser.Animations.Animation) => {
            if (animation.key === "goblin-hurt") {
              this.enemy.play("goblin-idle");
            }
          }
        );

        projectileFinished = true;
        finishAttack();
      });
    });
  }

  // --------------------------------------------------
  // PLAYER ATTACK COMPLETION
  // --------------------------------------------------

  private finishPlayerAttack() {
    if (this.isPlayerDead || this.isEnemyDead) return;

    this.player.play(this.playerAnimations.idle);

    this.resumeBreathing(this.player);
    this.resumeBreathing(this.enemy);

    this.isAttacking = false;

    const callback = this.playerAttackCallback;

    this.playerAttackCallback = undefined;

    callback?.();
  }

  // --------------------------------------------------
  // ARROW AND MAGIC PROJECTILES
  // --------------------------------------------------

  private createRangedProjectile(onHit: () => void) {
    const startX = this.player.x + 35;
    const startY = this.player.y - 105;

    const targetX = this.enemy.x - 35;
    const targetY = this.enemy.y - 95;

    if (this.playerClass === "archer") {
      this.createArrowProjectile(
        startX,
        startY,
        targetX,
        targetY,
        onHit
      );
    } else {
      this.createMagicProjectile(
        startX,
        startY,
        targetX,
        targetY,
        onHit
      );
    }
  }

  private createArrowProjectile(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    onHit: () => void
  ) {
    const arrow = this.add.container(startX, startY);
    arrow.setDepth(10);

    const shaft = this.add.rectangle(
      0,
      0,
      42,
      3,
      0xd8b47a
    );

    const head = this.add.triangle(
      23,
      0,
      -7,
      -6,
      8,
      0,
      -7,
      6,
      0xc9d3dc
    );

    const feather = this.add.triangle(
      -18,
      0,
      -6,
      -5,
      5,
      0,
      -6,
      5,
      0x7ba66a
    );

    arrow.add([shaft, head, feather]);

    const angle = Phaser.Math.Angle.Between(
      startX,
      startY,
      targetX,
      targetY
    );

    arrow.setRotation(angle);

    this.tweens.add({
      targets: arrow,
      x: targetX,
      y: targetY,
      duration: 320,
      ease: "Linear",
      onComplete: () => {
        arrow.destroy();
        this.showProjectileBurst(targetX, targetY, 0x9be7a5);
        onHit();
      },
    });
  }

  private createMagicProjectile(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    onHit: () => void
  ) {
    const spell = this.add.container(startX, startY);
    spell.setDepth(10);

    const outerGlow = this.add.circle(
      0,
      0,
      20,
      0x9565ff,
      0.25
    );

    const orb = this.add.circle(
      0,
      0,
      11,
      0xc5a0ff,
      0.95
    );

    const core = this.add.circle(
      -3,
      -3,
      5,
      0xffffff,
      0.95
    );

    const spark1 = this.add.circle(
      -14,
      -10,
      3,
      0xe2c8ff
    );

    const spark2 = this.add.circle(
      13,
      8,
      3,
      0xa98aff
    );

    spell.add([
      outerGlow,
      orb,
      core,
      spark1,
      spark2,
    ]);

    this.tweens.add({
      targets: spell,
      scale: 1.25,
      angle: 180,
      duration: 300,
      yoyo: true,
      repeat: 0,
      ease: "Sine.easeInOut",
    });

    this.tweens.add({
      targets: spell,
      x: targetX,
      y: targetY,
      duration: 420,
      ease: "Sine.easeIn",
      onComplete: () => {
        spell.destroy();
        this.showProjectileBurst(targetX, targetY, 0xb68aff);
        onHit();
      },
    });
  }

  private showProjectileBurst(
    x: number,
    y: number,
    color: number
  ) {
    for (let i = 0; i < 9; i++) {
      const particle = this.add.circle(
        x,
        y,
        Phaser.Math.Between(2, 5),
        color
      );

      particle.setDepth(12);

      const angle = (Math.PI * 2 * i) / 9;
      const distance = Phaser.Math.Between(20, 45);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: 350,
        ease: "Power2",
        onComplete: () => particle.destroy(),
      });
    }
  }

  // --------------------------------------------------
  // WARRIOR ATTACK RECOVERY
  // --------------------------------------------------

  private playAttackRecovery() {
    const originalX = this.player.x;
    const originalY = this.player.y;

    this.tweens.add({
      targets: this.player,
      x: originalX + 12,
      y: originalY + 4,
      scaleX: this.playerScale * 0.88,
      scaleY: this.playerScale * 1.10,
      duration: 120,
      yoyo: true,
      ease: "Sine.easeInOut",

      onComplete: () => {
        this.player.setPosition(originalX, originalY);
        this.player.setScale(this.playerScale);
        this.returnPlayer();
      },
    });
  }

  // --------------------------------------------------
  // RETURN PLAYER
  // --------------------------------------------------

  private returnPlayer() {
    this.player.play(this.playerAnimations.walk);

    this.tweens.add({
      targets: this.player,
      x: this.playerStartX,
      duration: 400,
      ease: "Power2",

      onComplete: () => {
        this.finishPlayerAttack();
      },
    });
  }

  // --------------------------------------------------
  // GOBLIN RETALIATION
  // --------------------------------------------------

  private performGoblinRetaliation() {
    const targetX = this.player.x + 115;

    this.playAnticipation(this.enemy, -1, () => {
      this.enemy.play("goblin-walk");

      this.tweens.add({
        targets: this.enemy,
        x: targetX,
        duration: 400,
        ease: "Power2",

        onComplete: () => {
          this.enemy.play("goblin-attack");

          let goblinAttackFinished = false;
          let playerHurtFinished = false;

          const finishRetaliation = () => {
            if (
              goblinAttackFinished &&
              playerHurtFinished
            ) {
              this.returnGoblin();
            }
          };

          this.enemy.once(
            Phaser.Animations.Events.ANIMATION_COMPLETE,
            (animation: Phaser.Animations.Animation) => {
              if (animation.key === "goblin-attack") {
                goblinAttackFinished = true;
                finishRetaliation();
              }
            }
          );

          this.time.delayedCall(600, () => {
            if (this.isPlayerDead) {
              playerHurtFinished = true;
              finishRetaliation();
              return;
            }

            this.showSlash(
              this.player.x + 25,
              this.player.y - 95,
              0xff6b6b
            );

            this.showImpact(
              this.player,
              0xff6b6b,
              this.enemyAttackDamage,
              -1
            );

            this.player.play(this.playerAnimations.hurt);

            this.player.once(
              Phaser.Animations.Events.ANIMATION_COMPLETE,
              (animation: Phaser.Animations.Animation) => {
                if (
                  animation.key === this.playerAnimations.hurt
                ) {
                  playerHurtFinished = true;
                  finishRetaliation();
                }
              }
            );
          });
        },
      });
    });
  }

  // --------------------------------------------------
  // RETURN GOBLIN
  // --------------------------------------------------

  private returnGoblin() {
    this.enemy.play("goblin-walk");

    this.tweens.add({
      targets: this.enemy,
      x: this.enemyStartX,
      duration: 400,
      ease: "Power2",

      onComplete: () => {
        this.enemy.play("goblin-idle");

        if (!this.isPlayerDead) {
          this.player.play(this.playerAnimations.idle);
          this.resumeBreathing(this.player);
        }

        this.resumeBreathing(this.enemy);

        this.isAttacking = false;

        const callback = this.enemyAttackCallback;

        this.enemyAttackCallback = undefined;

        callback?.();
      },
    });
  }

  // --------------------------------------------------
  // HIT REACTION
  // --------------------------------------------------

  private playHitReaction(
    target: Phaser.GameObjects.Sprite,
    direction: number
  ) {
    const originalX = target.x;
    const originalY = target.y;
    const originalScaleX = target.scaleX;
    const originalScaleY = target.scaleY;

    this.tweens.add({
      targets: target,
      x: originalX + direction * 28,
      y: originalY - 7,
      scaleX: originalScaleX * 0.90,
      scaleY: originalScaleY * 1.10,
      duration: 125,
      ease: "Power2",
      yoyo: true,
      repeat: 1,

      onComplete: () => {
        target.setPosition(originalX, originalY);
        target.setScale(originalScaleX, originalScaleY);
      },
    });
  }

  // --------------------------------------------------
  // IMPACT EFFECT
  // --------------------------------------------------

  private showImpact(
    target: Phaser.GameObjects.Sprite,
    color: number,
    damage: number,
    knockbackDirection: number
  ) {
    target
      .setTint(0xffffff)
      .setTintMode(Phaser.TintModes.FILL);

    this.time.delayedCall(140, () => {
      if (target.active) {
        target.clearTint();
      }
    });

    this.playHitReaction(target, knockbackDirection);

    this.cameras.main.shake(180, 0.009);

    this.showDamageNumber(
      target.x,
      target.y - 130,
      damage,
      color
    );

    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14;
      const distance = Phaser.Math.Between(40, 80);

      const particle = this.add.circle(
        target.x,
        target.y - 85,
        Phaser.Math.Between(4, 7),
        color
      );

      particle.setDepth(12);

      this.tweens.add({
        targets: particle,
        x: target.x + Math.cos(angle) * distance,
        y: target.y - 85 + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: 420,
        ease: "Power2",
        onComplete: () => particle.destroy(),
      });
    }
  }

  // --------------------------------------------------
  // SWORD SLASH
  // --------------------------------------------------

  private showSlash(
    x: number,
    y: number,
    color: number
  ) {
    const slash = this.add.ellipse(
      x,
      y,
      135,
      18,
      color,
      0.98
    );

    slash.setRotation(-0.55);
    slash.setDepth(10);
    slash.setScale(0.35);

    this.tweens.add({
      targets: slash,
      scaleX: 1.65,
      scaleY: 0.55,
      alpha: 0,
      rotation: 0.15,
      duration: 320,
      ease: "Power2",
      onComplete: () => slash.destroy(),
    });
  }

  // --------------------------------------------------
  // DAMAGE NUMBER
  // --------------------------------------------------

  private showDamageNumber(
    x: number,
    y: number,
    damage: number,
    color: number
  ) {
    if (damage <= 0) return;

    const damageText = this.add.text(
      x,
      y,
      `-${damage}`,
      {
        fontSize: "32px",
        fontStyle: "bold",
        color: `#${color.toString(16).padStart(6, "0")}`,
        stroke: "#171629",
        strokeThickness: 5,
      }
    );

    damageText.setOrigin(0.5);
    damageText.setDepth(20);

    this.tweens.add({
      targets: damageText,
      y: y - 75,
      alpha: 0,
      scale: 1.2,
      duration: 900,
      ease: "Power2",
      onComplete: () => damageText.destroy(),
    });
  }

  // --------------------------------------------------
  // DEATH ANIMATION
  // --------------------------------------------------

    // --------------------------------------------------
  // DEATH ANIMATION
  // --------------------------------------------------

  public playCharacterDeath(
    character: "player" | "enemy",
    onComplete?: BattleActionCallback
  ) {
    if (character === "player") {
      if (this.isPlayerDead) {
        onComplete?.();
        return;
      }

      this.isPlayerDead = true;
      this.isAttacking = true;

      this.pauseBreathing(this.player);
      this.tweens.killTweensOf(this.player);

      this.player.play(this.playerAnimations.death);

      this.player.once(
        Phaser.Animations.Events.ANIMATION_COMPLETE,
        (animation: Phaser.Animations.Animation) => {
          if (animation.key !== this.playerAnimations.death) {
            return;
          }

          this.player.setAlpha(0.65);
          onComplete?.();
        }
      );

      return;
    }

    if (this.isEnemyDead) {
      onComplete?.();
      return;
    }

    this.isEnemyDead = true;
    this.isAttacking = true;

    this.pauseBreathing(this.enemy);
    this.tweens.killTweensOf(this.enemy);

    this.enemy.play("goblin-death");

    this.enemy.once(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      (animation: Phaser.Animations.Animation) => {
        if (animation.key !== "goblin-death") {
          return;
        }

        this.enemy.setAlpha(0.65);
        onComplete?.();
      }
    );
  }

  // --------------------------------------------------
  // ATLAS ANIMATION CREATION
  // --------------------------------------------------

  private createAtlasAnimation(
    atlasKey: string,
    animationKey: string,
    framePrefix: string,
    frameRate: number,
    repeat: number
  ) {
    const texture = this.textures.get(atlasKey);

    const frames = texture
      .getFrameNames()
      .filter((frameName) => frameName.startsWith(framePrefix))
      .sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      );

    if (frames.length === 0) {
      console.error(`No frames found for ${animationKey}`);
      return;
    }

    this.anims.create({
      key: animationKey,
      frames: frames.map((frame) => ({
        key: atlasKey,
        frame,
      })),
      frameRate,
      repeat,
    });
  }
}
