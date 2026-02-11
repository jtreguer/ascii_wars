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

    const pos = gridManager.gridToPixel(col, row);
    this.text = scene.add.text(pos.x, pos.y, CONFIG.ENEMY_CHAR, {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: CONFIG.CELL_FONT_SIZE,
      color: CONFIG.COLORS.MAGENTA,
    }).setOrigin(0.5);
    this.text.setDepth(10);

    // Physics body for overlap
    scene.physics.add.existing(this.text);
    this.text.body.setSize(CONFIG.CELL_SIZE - 4, CONFIG.CELL_SIZE - 4);
    this.text.body.setImmovable(true);

    // Move timer
    this.moveTimer = scene.time.addEvent({
      delay: CONFIG.ENEMY_MOVE_SPEED + CONFIG.ENEMY_PATROL_PAUSE,
      callback: () => this._move(),
      loop: true,
    });
  }

  _move() {
    if (!this.alive || this.isMoving) return;

    const playerCol = this.scene.player?.col;
    const playerRow = this.scene.player?.row;

    let targetDir;
    if (
      playerCol !== undefined &&
      playerRow !== undefined &&
      manhattanDistance(this.col, this.row, playerCol, playerRow) <= CONFIG.ENEMY_CHASE_RANGE
    ) {
      targetDir = this._chaseDirection(playerCol, playerRow);
    } else {
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

    const target = this.gridManager.gridToPixel(newCol, newRow);
    this.scene.tweens.add({
      targets: this.text,
      x: target.x,
      y: target.y,
      duration: CONFIG.ENEMY_MOVE_SPEED,
      ease: 'Linear',
      onComplete: () => {
        this.isMoving = false;
      },
    });
  }

  _chaseDirection(playerCol, playerRow) {
    const dirs = [];
    if (playerRow < this.row) dirs.push(DIRECTION.UP);
    if (playerRow > this.row) dirs.push(DIRECTION.DOWN);
    if (playerCol < this.col) dirs.push(DIRECTION.LEFT);
    if (playerCol > this.col) dirs.push(DIRECTION.RIGHT);

    // Try chase directions first, then random
    const shuffled = shuffleArray(dirs);
    for (const dir of shuffled) {
      const d = DIRECTION_DELTA[dir];
      if (this.gridManager.isWalkable(this.col + d.dx, this.row + d.dy)) {
        return dir;
      }
    }
    return this._patrolDirection();
  }

  _patrolDirection() {
    const allDirs = shuffleArray([DIRECTION.UP, DIRECTION.DOWN, DIRECTION.LEFT, DIRECTION.RIGHT]);
    for (const dir of allDirs) {
      const d = DIRECTION_DELTA[dir];
      if (this.gridManager.isWalkable(this.col + d.dx, this.row + d.dy)) {
        return dir;
      }
    }
    return null;
  }

  die() {
    this.alive = false;
    this.moveTimer.remove(false);
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
    this.moveTimer.remove(false);
    this.text.destroy();
  }
}
