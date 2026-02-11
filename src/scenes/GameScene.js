import { CONFIG } from '../config.js';
import { CELL_TYPE, EVENTS, DIRECTION_DELTA } from '../utils/constants.js';
import { manhattanDistance } from '../utils/math.js';
import MazeGenerator from '../systems/MazeGenerator.js';
import GridManager from '../systems/GridManager.js';
import Player from '../objects/Player.js';
import Enemy from '../objects/Enemy.js';
import Disc from '../objects/Disc.js';
import Token from '../objects/Token.js';
import SpeedBonus from '../objects/SpeedBonus.js';
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
    this.elapsedMs = 0;
    this.lastEmittedSecond = -1;
    this.speedBonusActive = false;
    this.speedBonusTimer = null;
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

    // Spawn speed bonus (level 2+)
    this.speedBonus = null;
    let speedBonusOffset = 0;
    if (this.level >= CONFIG.SPEED_BONUS.MIN_LEVEL && spawnPositions.length > tokenCount) {
      const bonusPos = spawnPositions[tokenCount];
      this.speedBonus = new SpeedBonus(this, this.gridManager, bonusPos.col, bonusPos.row);
      speedBonusOffset = 1;
    }

    // Spawn enemies (use positions after tokens + bonus, excluding player line of sight)
    const enemyPositions = spawnPositions.slice(tokenCount + speedBonusOffset).filter(
      pos => manhattanDistance(pos.col, pos.row, this.startPos.col, this.startPos.row) >= CONFIG.ENEMY_MIN_SPAWN_DISTANCE &&
        !this._hasLineOfSight(pos.col, pos.row, this.startPos.col, this.startPos.row),
    );
    const enemyCount = Math.min(
      CONFIG.LEVEL.BASE_ENEMIES + (this.level - 1) * CONFIG.LEVEL.ENEMIES_PER_LEVEL,
      CONFIG.LEVEL.MAX_ENEMIES,
      enemyPositions.length,
    );
    this.enemies = [];
    for (let i = 0; i < enemyCount; i++) {
      const pos = enemyPositions[i];
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

    // Dev mode: S key to skip level
    if (CONFIG.DEV_MODE) {
      this.skipKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.skipKey.on('down', () => {
        if (!this.levelComplete) this._nextLevel();
      });
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

  _isWall(r, c) {
    if (r < 0 || r >= CONFIG.GRID_ROWS || c < 0 || c >= CONFIG.GRID_COLS) return true;
    return this.grid[r][c] === CELL_TYPE.WALL;
  }

  _getWallChar(r, c) {
    const up = this._isWall(r - 1, c);
    const down = this._isWall(r + 1, c);
    const left = this._isWall(r, c - 1);
    const right = this._isWall(r, c + 1);
    const hasH = left || right;
    const hasV = up || down;

    if (hasH && hasV) return '+';
    if (hasH) return '-';
    if (hasV) return '|';
    return '+';
  }

  _renderMaze() {
    this.wallTexts = [];
    this.wallGrid = [];
    for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
      this.wallGrid[r] = new Array(CONFIG.GRID_COLS).fill(null);
    }
    this._litWalls = [];
    this._lastGlowCol = -1;
    this._lastGlowRow = -1;

    for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
      for (let c = 0; c < CONFIG.GRID_COLS; c++) {
        const cell = this.grid[r][c];
        const pos = this.gridManager.gridToPixel(c, r);

        if (cell === CELL_TYPE.WALL) {
          const t = this.add.text(pos.x, pos.y, this._getWallChar(r, c), {
            fontFamily: CONFIG.FONT_FAMILY,
            fontSize: CONFIG.CELL_FONT_SIZE,
            color: CONFIG.COLORS.WALL,
          }).setOrigin(0.5);
          this.wallTexts.push(t);
          this.wallGrid[r][c] = t;
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
    this._checkDiscHit(disc);
  }

  _checkDiscHit(disc) {
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

  _updateWallGlow() {
    const pc = this.player.col;
    const pr = this.player.row;
    if (pc === this._lastGlowCol && pr === this._lastGlowRow) return;
    this._lastGlowCol = pc;
    this._lastGlowRow = pr;

    // Reset previously lit walls
    for (const wall of this._litWalls) {
      wall.setColor(CONFIG.COLORS.WALL);
    }
    this._litWalls = [];

    const glowLevels = CONFIG.COLORS.WALL_GLOW;
    const maxRadius = glowLevels[glowLevels.length - 1].radius;

    for (let r = pr - maxRadius; r <= pr + maxRadius; r++) {
      if (r < 0 || r >= CONFIG.GRID_ROWS) continue;
      for (let c = pc - maxRadius; c <= pc + maxRadius; c++) {
        if (c < 0 || c >= CONFIG.GRID_COLS) continue;
        const wall = this.wallGrid[r][c];
        if (!wall) continue;

        const dist = Math.max(Math.abs(c - pc), Math.abs(r - pr));
        for (const level of glowLevels) {
          if (dist <= level.radius) {
            wall.setColor(level.color);
            this._litWalls.push(wall);
            break;
          }
        }
      }
    }
  }

  update(time, delta) {
    if (this.levelComplete) return;

    // Track level time
    this.elapsedMs += delta;
    const sec = Math.floor(this.elapsedMs / 1000);
    if (sec !== this.lastEmittedSecond) {
      this.lastEmittedSecond = sec;
      const uiScene = this.scene.get('UIScene');
      if (uiScene && uiScene.scene.isActive()) {
        uiScene.events.emit(EVENTS.TIMER_CHANGED, sec);
      }
    }

    this.player.update();
    this._updateWallGlow();

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

    // Check speed bonus collection
    if (this.speedBonus && !this.speedBonus.collected) {
      if (this.player.col === this.speedBonus.col && this.player.row === this.speedBonus.row) {
        this._collectSpeedBonus();
      }
    }

    // Check disc-enemy collisions every frame (supplements event-based check)
    for (const disc of this.discs) {
      this._checkDiscHit(disc);
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

    // Time bonus
    const seconds = Math.floor(this.elapsedMs / 1000);
    let multiplier = CONFIG.TIME_BONUS_DEFAULT;
    for (const tier of CONFIG.TIME_BONUS) {
      if (seconds < tier.maxSeconds) {
        multiplier = tier.multiplier;
        break;
      }
    }
    const timeBonus = CONFIG.LEVEL_COMPLETE_BONUS * multiplier;

    // Disc bonus
    const discIdx = Math.min(this.discsRemaining, CONFIG.DISC_BONUS.length - 1);
    const discBonus = CONFIG.DISC_BONUS[discIdx];

    this.score += timeBonus + discBonus;
    this.soundManager?.playTriumph();

    // Show bonus recap
    const uiScene = this.scene.get('UIScene');
    if (uiScene && uiScene.scene.isActive()) {
      uiScene.events.emit(EVENTS.SCORE_CHANGED, this.score);
      uiScene.events.emit('show-bonus', timeBonus, multiplier, discBonus, this.discsRemaining);
    }

    this.cameras.main.flash(300, 0, 255, 0);
    this.time.delayedCall(CONFIG.LEVEL_RECAP_DURATION, () => {
      this._cleanup();
      if (this.level >= CONFIG.MAX_LEVEL) {
        this.scene.stop('UIScene');
        this.scene.start('VictoryScene', { score: this.score });
      } else {
        this.scene.restart({ level: this.level + 1, score: this.score, lives: this.lives });
      }
    });
  }

  _collectSpeedBonus() {
    this.speedBonus.collect();
    this.soundManager?.playSpeedBonus();
    this.speedBonusActive = true;
    this.player.speedMultiplier = CONFIG.SPEED_BONUS.MULTIPLIER;

    // Tint player to indicate speed boost
    this.player.text.setColor(CONFIG.COLORS.WHITE);

    const uiScene = this.scene.get('UIScene');

    // Countdown timer for UI
    let remaining = CONFIG.SPEED_BONUS.DURATION / 1000;
    if (uiScene && uiScene.scene.isActive()) {
      uiScene.events.emit(EVENTS.SPEED_BONUS_CHANGED, remaining);
    }

    this.speedBonusCountdown = this.time.addEvent({
      delay: 1000,
      repeat: remaining - 1,
      callback: () => {
        remaining--;
        if (uiScene && uiScene.scene.isActive()) {
          uiScene.events.emit(EVENTS.SPEED_BONUS_CHANGED, remaining);
        }
      },
    });

    // End speed boost after duration
    this.speedBonusTimer = this.time.delayedCall(CONFIG.SPEED_BONUS.DURATION, () => {
      this.speedBonusActive = false;
      this.player.speedMultiplier = 1;
      if (this.player.alive) {
        this.player.text.setColor(CONFIG.COLORS.CYAN);
      }
      if (uiScene && uiScene.scene.isActive()) {
        uiScene.events.emit(EVENTS.SPEED_BONUS_CHANGED, 0);
      }
    });
  }

  _playerHit() {
    this.dying = true;

    // Cancel speed bonus if active
    if (this.speedBonusActive) {
      this.speedBonusActive = false;
      if (this.speedBonusTimer) { this.speedBonusTimer.destroy(); this.speedBonusTimer = null; }
      if (this.speedBonusCountdown) { this.speedBonusCountdown.destroy(); this.speedBonusCountdown = null; }
      const ui = this.scene.get('UIScene');
      if (ui && ui.scene.isActive()) ui.events.emit(EVENTS.SPEED_BONUS_CHANGED, 0);
    }

    this.player.die();
    this.soundManager?.playHit();
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

  _hasLineOfSight(col1, row1, col2, row2) {
    if (col1 === col2) {
      const minR = Math.min(row1, row2);
      const maxR = Math.max(row1, row2);
      for (let r = minR + 1; r < maxR; r++) {
        if (this.grid[r][col1] !== CELL_TYPE.FLOOR) return false;
      }
      return true;
    }
    if (row1 === row2) {
      const minC = Math.min(col1, col2);
      const maxC = Math.max(col1, col2);
      for (let c = minC + 1; c < maxC; c++) {
        if (this.grid[row1][c] !== CELL_TYPE.FLOOR) return false;
      }
      return true;
    }
    return false;
  }

  _cleanup() {
    this.events.off('player-throw-disc', this._onThrowDisc, this);
    this.events.off('disc-moved', this._onDiscMoved, this);
    if (this.skipKey) this.skipKey.removeAllListeners();
    if (this.speedBonusTimer) this.speedBonusTimer.destroy();
    if (this.speedBonusCountdown) this.speedBonusCountdown.destroy();
    this.soundManager?.destroy();
  }

  shutdown() {
    this._cleanup();
    this.player?.destroy();
    this.enemies?.forEach(e => e.destroy());
    this.discs?.forEach(d => d.destroy());
    this.tokens?.forEach(t => t.destroy());
    this.speedBonus?.destroy();
  }
}
