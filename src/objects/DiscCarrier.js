import { CONFIG } from '../config.js';
import { DIRECTION, DIRECTION_DELTA } from '../utils/constants.js';
import { shuffleArray } from '../utils/math.js';

export default class DiscCarrier {
  constructor(scene, gridManager, col, row) {
    this.scene = scene;
    this.gridManager = gridManager;
    this.col = col;
    this.row = row;
    this.collected = false;
    this.isMoving = false;
    this._colorIndex = 0;

    this.patrolAnchor = { col, row };

    const pos = gridManager.gridToPixel(col, row);
    this.text = scene.add.text(pos.x, pos.y, CONFIG.DISC_CARRIER.CHAR, {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: CONFIG.CELL_FONT_SIZE,
      color: CONFIG.COLORS.WHITE,
    }).setOrigin(0.5);
    this.text.setDepth(5);

    // Blink white/orange
    this.blinkTimer = scene.time.addEvent({
      delay: CONFIG.DISC_CARRIER.BLINK_INTERVAL,
      loop: true,
      callback: () => {
        if (this.collected) return;
        this._colorIndex = 1 - this._colorIndex;
        this.text.setColor(this._colorIndex === 0 ? CONFIG.COLORS.WHITE : CONFIG.COLORS.ORANGE);
      },
    });

    // Start moving
    this._scheduleMove();
  }

  _scheduleMove() {
    if (this.collected) return;
    const delay = CONFIG.DISC_CARRIER.MOVE_SPEED + CONFIG.DISC_CARRIER.MOVE_PAUSE;
    this.moveTimer = this.scene.time.delayedCall(delay, () => {
      this._move();
      this._scheduleMove();
    });
  }

  _move() {
    if (this.collected || this.isMoving) return;

    const dir = this._patrolDirection();
    if (!dir) return;

    const delta = DIRECTION_DELTA[dir];
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
      duration: CONFIG.DISC_CARRIER.MOVE_SPEED,
      ease: 'Linear',
      onComplete: () => {
        this.isMoving = false;
      },
    });
  }

  _patrolDirection() {
    const dist = Math.max(
      Math.abs(this.col - this.patrolAnchor.col),
      Math.abs(this.row - this.patrolAnchor.row),
    );

    if (dist > CONFIG.DISC_CARRIER.PATROL_RADIUS) {
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

  collect() {
    if (this.collected) return;
    this.collected = true;
    if (this.blinkTimer) this.blinkTimer.destroy();
    if (this.moveTimer) this.moveTimer.destroy();

    this.scene.tweens.killTweensOf(this.text);
    this.scene.tweens.add({
      targets: this.text,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.text.setVisible(false);
        this.text.setActive(false);
      },
    });
  }

  destroy() {
    if (this.blinkTimer) this.blinkTimer.destroy();
    if (this.moveTimer) this.moveTimer.destroy();
    this.scene.tweens.killTweensOf(this.text);
    this.text.destroy();
  }
}
