import { CONFIG } from '../config.js';
import { DIRECTION, DIRECTION_DELTA, EVENTS } from '../utils/constants.js';

export default class Player {
  constructor(scene, gridManager, col, row) {
    this.scene = scene;
    this.gridManager = gridManager;
    this.col = col;
    this.row = row;
    this.facing = DIRECTION.RIGHT;
    this.isMoving = false;
    this.alive = true;
    this.aiming = false;
    this.speedMultiplier = 1;

    const pos = gridManager.gridToPixel(col, row);
    this.text = scene.add.text(pos.x, pos.y, CONFIG.PLAYER_CHAR, {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: CONFIG.CELL_FONT_SIZE,
      color: CONFIG.COLORS.CYAN,
    }).setOrigin(0.5);
    this.text.setDepth(10);

    // Physics body for overlap detection
    scene.physics.add.existing(this.text);
    this.text.body.setSize(CONFIG.CELL_SIZE - 4, CONFIG.CELL_SIZE - 4);
    this.text.body.setImmovable(true);

    this._setupInput();
  }

  _setupInput() {
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update() {
    if (!this.alive || this.isMoving) return;

    // Aiming: hold SPACE while discs available
    const wantsAim = this.spaceKey.isDown && this.scene.discsRemaining > 0;
    if (wantsAim && !this.aiming) {
      this.aiming = true;
      this.text.setColor(CONFIG.COLORS.ORANGE);
    } else if (!wantsAim && this.aiming) {
      this.aiming = false;
      this.text.setColor(CONFIG.COLORS.CYAN);
    }

    if (this.aiming) {
      // JustDown so each key press fires one disc
      let dir = DIRECTION.NONE;
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) dir = DIRECTION.UP;
      else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) dir = DIRECTION.DOWN;
      else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) dir = DIRECTION.LEFT;
      else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) dir = DIRECTION.RIGHT;

      if (dir !== DIRECTION.NONE) {
        this.facing = dir;
        this.scene.events.emit('player-throw-disc', this.col, this.row, dir);
      }
      return;
    }

    // Normal movement
    let dir = DIRECTION.NONE;
    if (this.cursors.up.isDown) dir = DIRECTION.UP;
    else if (this.cursors.down.isDown) dir = DIRECTION.DOWN;
    else if (this.cursors.left.isDown) dir = DIRECTION.LEFT;
    else if (this.cursors.right.isDown) dir = DIRECTION.RIGHT;

    if (dir === DIRECTION.NONE) return;

    this.facing = dir;
    const delta = DIRECTION_DELTA[dir];
    const newCol = this.col + delta.dx;
    const newRow = this.row + delta.dy;

    if (!this.gridManager.isWalkable(newCol, newRow)) return;

    this.isMoving = true;

    // Spawn trail ghost at current position before moving
    const trailColor = this.speedMultiplier > 1 ? CONFIG.JUICE.TRAIL_SPEED_COLOR : CONFIG.JUICE.TRAIL_COLOR;
    const trail = this.scene.add.text(this.text.x, this.text.y, CONFIG.JUICE.TRAIL_CHAR, {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: CONFIG.CELL_FONT_SIZE,
      color: trailColor,
    }).setOrigin(0.5).setAlpha(CONFIG.JUICE.TRAIL_ALPHA).setDepth(5);
    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      duration: CONFIG.JUICE.TRAIL_DURATION,
      ease: 'Linear',
      onComplete: () => trail.destroy(),
    });

    this.col = newCol;
    this.row = newRow;

    const target = this.gridManager.gridToPixel(newCol, newRow);
    this.scene.tweens.add({
      targets: this.text,
      x: target.x,
      y: target.y,
      duration: CONFIG.PLAYER_MOVE_SPEED / this.speedMultiplier,
      ease: 'Linear',
      onComplete: () => {
        this.isMoving = false;
      },
    });
  }

  die() {
    this.alive = false;
    this.aiming = false;
    this.text.setColor(CONFIG.COLORS.RED);
    this.scene.tweens.add({
      targets: this.text,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 500,
      ease: 'Power2',
    });
  }

  respawn(col, row) {
    this.scene.tweens.killTweensOf(this.text);
    this.col = col;
    this.row = row;
    this.alive = true;
    this.isMoving = false;
    this.aiming = false;
    this.facing = DIRECTION.RIGHT;
    this.speedMultiplier = 1;

    const pos = this.gridManager.gridToPixel(col, row);
    this.text.setPosition(pos.x, pos.y);
    this.text.setAlpha(1);
    this.text.setScale(1);
    this.text.setColor(CONFIG.COLORS.CYAN);
  }

  destroy() {
    if (this.spaceKey) {
      this.spaceKey.removeAllListeners();
    }
    this.text.destroy();
  }
}
