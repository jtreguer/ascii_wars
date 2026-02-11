import { CONFIG } from '../config.js';
import { DIRECTION, DIRECTION_DELTA, CELL_TYPE } from '../utils/constants.js';
import { manhattanDistance, shuffleArray } from '../utils/math.js';

export default class Enemy {
  constructor(scene, gridManager, col, row) {
    this.scene = scene;
    this.gridManager = gridManager;
    this.col = col;
    this.row = row;
    this.isMoving = false;
    this.alive = true;
    this.charIndex = 0;
    this.chasing = false;

    // Patrol roaming
    this.patrolAnchor = { col, row };
    this.patrolMoveCount = 0;
    this.relocateThreshold = this._nextRelocateThreshold();

    const pos = gridManager.gridToPixel(col, row);
    this.text = scene.add.text(pos.x, pos.y, CONFIG.ENEMY_CHARS[0], {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: CONFIG.CELL_FONT_SIZE,
      color: CONFIG.COLORS.MAGENTA,
    }).setOrigin(0.5);
    this.text.setDepth(10);

    // Physics body for overlap
    scene.physics.add.existing(this.text);
    this.text.body.setSize(CONFIG.CELL_SIZE - 4, CONFIG.CELL_SIZE - 4);
    this.text.body.setImmovable(true);

    // Start patrol timer
    this._scheduleMove();
  }

  _nextRelocateThreshold() {
    return CONFIG.ENEMY_RELOCATE_MIN_MOVES +
      Math.floor(Math.random() * (CONFIG.ENEMY_RELOCATE_MAX_MOVES - CONFIG.ENEMY_RELOCATE_MIN_MOVES + 1));
  }

  _scheduleMove() {
    if (!this.alive) return;
    const delay = this.chasing
      ? CONFIG.ENEMY_CHASE_SPEED + CONFIG.ENEMY_CHASE_PAUSE
      : CONFIG.ENEMY_MOVE_SPEED + CONFIG.ENEMY_PATROL_PAUSE;

    this.moveTimer = this.scene.time.delayedCall(delay, () => {
      this._move();
      this._scheduleMove();
    });
  }

  _move() {
    if (!this.alive || this.isMoving) return;

    const playerCol = this.scene.player?.col;
    const playerRow = this.scene.player?.row;
    const playerAlive = this.scene.player?.alive;

    const inRange = playerCol !== undefined && playerRow !== undefined && playerAlive &&
      manhattanDistance(this.col, this.row, playerCol, playerRow) <= CONFIG.ENEMY_CHASE_RANGE;

    // Update chase state
    if (inRange && !this.chasing) {
      this.chasing = true;
      this.text.setColor(CONFIG.COLORS.RED);
      this.scene.soundManager?.playAlertSiren();
    } else if (!inRange && this.chasing) {
      this.chasing = false;
      this.text.setColor(CONFIG.COLORS.MAGENTA);
      // Anchor to where we stopped chasing
      this.patrolAnchor = { col: this.col, row: this.row };
      this.patrolMoveCount = 0;
      this.relocateThreshold = this._nextRelocateThreshold();
    }

    let targetDir;
    if (inRange) {
      targetDir = this._chaseDirection(playerCol, playerRow);
    } else {
      this.patrolMoveCount++;
      if (this.patrolMoveCount >= this.relocateThreshold) {
        this._pickNewAnchor();
        this.patrolMoveCount = 0;
        this.relocateThreshold = this._nextRelocateThreshold();
      }
      targetDir = this._patrolDirection();
    }

    if (!targetDir) return;

    const delta = DIRECTION_DELTA[targetDir];
    const newCol = this.col + delta.dx;
    const newRow = this.row + delta.dy;

    if (!this.gridManager.isWalkable(newCol, newRow)) return;

    this.isMoving = true;
    this.col = newCol;
    this.row = newRow;

    // Cycle through chars — faster set when chasing
    const chars = this.chasing ? CONFIG.ENEMY_CHASE_CHARS : CONFIG.ENEMY_CHARS;
    this.charIndex = (this.charIndex + 1) % chars.length;
    this.text.setText(chars[this.charIndex]);

    const moveSpeed = this.chasing ? CONFIG.ENEMY_CHASE_SPEED : CONFIG.ENEMY_MOVE_SPEED;
    const target = this.gridManager.gridToPixel(newCol, newRow);
    this.scene.tweens.add({
      targets: this.text,
      x: target.x,
      y: target.y,
      duration: moveSpeed,
      ease: 'Linear',
      onComplete: () => {
        this.isMoving = false;
      },
    });
  }

  _chaseDirection(playerCol, playerRow) {
    return this._moveToward(playerCol, playerRow) || this._randomWalkable();
  }

  _patrolDirection() {
    const dist = manhattanDistance(this.col, this.row, this.patrolAnchor.col, this.patrolAnchor.row);

    if (dist > CONFIG.ENEMY_PATROL_RADIUS) {
      const toward = this._moveToward(this.patrolAnchor.col, this.patrolAnchor.row);
      if (toward) return toward;
    }

    return this._randomWalkable();
  }

  _moveToward(targetCol, targetRow) {
    const dirs = [];
    if (targetRow < this.row) dirs.push(DIRECTION.UP);
    if (targetRow > this.row) dirs.push(DIRECTION.DOWN);
    if (targetCol < this.col) dirs.push(DIRECTION.LEFT);
    if (targetCol > this.col) dirs.push(DIRECTION.RIGHT);

    const shuffled = shuffleArray(dirs);
    for (const dir of shuffled) {
      const d = DIRECTION_DELTA[dir];
      if (this.gridManager.isWalkable(this.col + d.dx, this.row + d.dy)) {
        return dir;
      }
    }
    return null;
  }

  _randomWalkable() {
    const allDirs = shuffleArray([DIRECTION.UP, DIRECTION.DOWN, DIRECTION.LEFT, DIRECTION.RIGHT]);
    for (const dir of allDirs) {
      const d = DIRECTION_DELTA[dir];
      if (this.gridManager.isWalkable(this.col + d.dx, this.row + d.dy)) {
        return dir;
      }
    }
    return null;
  }

  _pickNewAnchor() {
    const dist = CONFIG.ENEMY_RELOCATE_DISTANCE;
    for (let attempt = 0; attempt < 10; attempt++) {
      const dx = Math.floor(Math.random() * (dist * 2 + 1)) - dist;
      const dy = Math.floor(Math.random() * (dist * 2 + 1)) - dist;
      const newCol = this.patrolAnchor.col + dx;
      const newRow = this.patrolAnchor.row + dy;
      if (manhattanDistance(this.col, this.row, newCol, newRow) >= 3 &&
          this.gridManager.isWalkable(newCol, newRow)) {
        this.patrolAnchor = { col: newCol, row: newRow };
        return;
      }
    }
  }

  die() {
    this.alive = false;
    if (this.moveTimer) this.moveTimer.destroy();
    this.text.setColor(CONFIG.COLORS.RED);
    this.scene.tweens.add({
      targets: this.text,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.text.setVisible(false);
        this.text.setActive(false);
      },
    });
  }

  destroy() {
    if (this.moveTimer) this.moveTimer.destroy();
    this.text.destroy();
  }
}
