import { CONFIG } from '../config.js';
import { CELL_TYPE, EVENTS, DIRECTION_DELTA } from '../utils/constants.js';
import MazeGenerator from '../systems/MazeGenerator.js';
import GridManager from '../systems/GridManager.js';
import Player from '../objects/Player.js';
import Enemy from '../objects/Enemy.js';
import Disc from '../objects/Disc.js';
import Token from '../objects/Token.js';
import SoundManager from '../systems/SoundManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.level = data.level || 1;
    this.score = data.score || 0;
    this.lives = data.lives ?? CONFIG.PLAYER_LIVES;
    this.discsRemaining = CONFIG.LEVEL.DISCS_PER_LEVEL;
    this.allTokensCollected = false;
    this.levelComplete = false;
    this.invulnerable = false;
    this.dying = false;
  }

  create() {
    // Generate maze
    const mazeGen = new MazeGenerator();
    this.grid = mazeGen.generate(
      CONFIG.GRID_COLS, CONFIG.GRID_ROWS,
      CONFIG.ROOM_COUNT, CONFIG.ROOM_MIN_SIZE, CONFIG.ROOM_MAX_SIZE,
    );
    this.exitPos = mazeGen.placeExit(this.grid);
    this.startPos = mazeGen.getStartPosition();
    this.gridManager = new GridManager(this.grid);

    // Get spawnable positions (excluding start and exit)
    const spawnPositions = mazeGen.getSpawnablePositions(this.grid, [
      this.startPos,
      this.exitPos,
    ]);

    // Render maze
    this._renderMaze();

    // Spawn player
    this.player = new Player(this, this.gridManager, this.startPos.col, this.startPos.row);

    // Spawn tokens
    const tokenCount = Math.min(
      CONFIG.LEVEL.BASE_TOKENS + (this.level - 1) * CONFIG.LEVEL.TOKENS_PER_LEVEL,
      CONFIG.LEVEL.MAX_TOKENS,
      spawnPositions.length,
    );
    this.tokens = [];
    for (let i = 0; i < tokenCount; i++) {
      const pos = spawnPositions[i];
      this.tokens.push(new Token(this, this.gridManager, pos.col, pos.row));
    }
    this.totalTokens = tokenCount;
    this.collectedTokens = 0;

    // Spawn enemies (use positions after tokens)
    const enemyCount = Math.min(
      CONFIG.LEVEL.BASE_ENEMIES + (this.level - 1) * CONFIG.LEVEL.ENEMIES_PER_LEVEL,
      CONFIG.LEVEL.MAX_ENEMIES,
      spawnPositions.length - tokenCount,
    );
    this.enemies = [];
    for (let i = 0; i < enemyCount; i++) {
      const pos = spawnPositions[tokenCount + i];
      this.enemies.push(new Enemy(this, this.gridManager, pos.col, pos.row));
    }

    // Disc pool
    this.discs = [];
    for (let i = 0; i < CONFIG.DISC_POOL_SIZE; i++) {
      this.discs.push(new Disc(this, this.gridManager));
    }

    // Events
    this.events.on('player-throw-disc', this._onThrowDisc, this);
    this.events.on('disc-moved', this._onDiscMoved, this);

    // Audio
    this.soundManager = new SoundManager(this);
    if (this.soundManager.init()) {
      this.soundManager.startAmbient();
    }

    // Emit initial UI state (delay to ensure UIScene is ready)
    this.time.delayedCall(50, () => {
      const uiScene = this.scene.get('UIScene');
      if (uiScene && uiScene.scene.isActive()) {
        uiScene.events.emit(EVENTS.SCORE_CHANGED, this.score);
        uiScene.events.emit(EVENTS.DISCS_CHANGED, this.discsRemaining);
        uiScene.events.emit(EVENTS.LEVEL_CHANGED, this.level);
        uiScene.events.emit(EVENTS.LIVES_CHANGED, this.lives);
      }
    });
  }

  _renderMaze() {
    this.wallTexts = [];
    for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
      for (let c = 0; c < CONFIG.GRID_COLS; c++) {
        const cell = this.grid[r][c];
        const pos = this.gridManager.gridToPixel(c, r);

        if (cell === CELL_TYPE.WALL) {
          const t = this.add.text(pos.x, pos.y, CONFIG.MAZE_WALL_CHAR, {
            fontFamily: CONFIG.FONT_FAMILY,
            fontSize: CONFIG.CELL_FONT_SIZE,
            color: CONFIG.COLORS.WALL,
          }).setOrigin(0.5);
          this.wallTexts.push(t);
        } else if (cell === CELL_TYPE.EXIT) {
          this.exitText = this.add.text(pos.x, pos.y, CONFIG.MAZE_EXIT_CHAR, {
            fontFamily: CONFIG.FONT_FAMILY,
            fontSize: CONFIG.CELL_FONT_SIZE,
            color: CONFIG.COLORS.EXIT_LOCKED,
          }).setOrigin(0.5);
          this.exitText.setDepth(5);
        }
      }
    }
  }

  _onThrowDisc(col, row, direction) {
    if (this.discsRemaining <= 0) return;

    const disc = this.discs.find(d => !d.active);
    if (!disc) return;

    this.discsRemaining--;
    const uiScene = this.scene.get('UIScene');
    if (uiScene && uiScene.scene.isActive()) {
      uiScene.events.emit(EVENTS.DISCS_CHANGED, this.discsRemaining);
    }

    // Fire disc from adjacent cell in facing direction
    const delta = DIRECTION_DELTA[direction];
    const startCol = col + delta.dx;
    const startRow = row + delta.dy;

    if (!this.gridManager.isWalkable(startCol, startRow)) {
      // Disc hits wall immediately — refund
      this.discsRemaining++;
      if (uiScene && uiScene.scene.isActive()) {
        uiScene.events.emit(EVENTS.DISCS_CHANGED, this.discsRemaining);
      }
      return;
    }

    disc.fire(startCol, startRow, direction);
    this.soundManager?.playPew();
  }

  _onDiscMoved(disc) {
    if (!disc.active) return;

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (enemy.col === disc.col && enemy.row === disc.row) {
        enemy.die();
        disc.deactivate();
        this.soundManager?.playEnemyKill();
        this.score += CONFIG.ENEMY_KILL_SCORE;
        const uiScene = this.scene.get('UIScene');
        if (uiScene && uiScene.scene.isActive()) {
          uiScene.events.emit(EVENTS.SCORE_CHANGED, this.score);
        }
        break;
      }
    }
  }

  update() {
    if (this.levelComplete) return;

    this.player.update();

    if (!this.player.alive) return;

    // Check token collection
    for (const token of this.tokens) {
      if (token.collected) continue;
      if (this.player.col === token.col && this.player.row === token.row) {
        token.collect();
        this.collectedTokens++;
        this.score += CONFIG.TOKEN_SCORE;
        this.soundManager?.playTokenCollect();
        const uiScene = this.scene.get('UIScene');
        if (uiScene && uiScene.scene.isActive()) {
          uiScene.events.emit(EVENTS.SCORE_CHANGED, this.score);
        }

        if (this.collectedTokens >= this.totalTokens) {
          this.allTokensCollected = true;
          this._unlockExit();
        }
      }
    }

    // Check enemy collision
    if (!this.invulnerable && !this.dying) {
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        if (this.player.col === enemy.col && this.player.row === enemy.row) {
          this._playerHit();
          return;
        }
      }
    }

    // Check exit
    if (this.allTokensCollected && this.player.col === this.exitPos.col && this.player.row === this.exitPos.row) {
      this._nextLevel();
    }
  }

  _unlockExit() {
    if (this.exitText) {
      this.exitText.setColor(CONFIG.COLORS.EXIT_UNLOCKED);
      this.tweens.add({
        targets: this.exitText,
        alpha: 0.4,
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  _nextLevel() {
    this.levelComplete = true;
    this.score += CONFIG.LEVEL_COMPLETE_BONUS;
    this.soundManager?.playTriumph();

    this.cameras.main.flash(300, 0, 255, 0);
    this.time.delayedCall(500, () => {
      this._cleanup();
      this.scene.restart({ level: this.level + 1, score: this.score, lives: this.lives });
    });
  }

  _playerHit() {
    this.dying = true;
    this.player.die();
    this.soundManager?.playDeath();
    this.cameras.main.shake(300, 0.02);
    this.cameras.main.flash(300, 255, 0, 0);

    this.lives--;
    const uiScene = this.scene.get('UIScene');
    if (uiScene && uiScene.scene.isActive()) {
      uiScene.events.emit(EVENTS.LIVES_CHANGED, this.lives);
    }

    if (this.lives > 0) {
      // Respawn at start with current game state
      this.time.delayedCall(CONFIG.RESPAWN_DELAY, () => {
        this._respawnPlayer();
      });
    } else {
      // Final death — game over
      this.time.delayedCall(1000, () => {
        this._cleanup();
        this.scene.stop('UIScene');
        this.scene.start('GameOverScene', { score: this.score, level: this.level });
      });
    }
  }

  _respawnPlayer() {
    this.dying = false;
    this.invulnerable = true;
    this.player.respawn(this.startPos.col, this.startPos.row);

    // Blink during invulnerability
    this.tweens.add({
      targets: this.player.text,
      alpha: 0.2,
      duration: 100,
      yoyo: true,
      repeat: 7,
      ease: 'Linear',
      onComplete: () => {
        this.player.text.setAlpha(1);
        this.invulnerable = false;
      },
    });
  }

  _cleanup() {
    this.events.off('player-throw-disc', this._onThrowDisc, this);
    this.events.off('disc-moved', this._onDiscMoved, this);
    this.soundManager?.destroy();
  }

  shutdown() {
    this._cleanup();
    this.player?.destroy();
    this.enemies?.forEach(e => e.destroy());
    this.discs?.forEach(d => d.destroy());
    this.tokens?.forEach(t => t.destroy());
  }
}
