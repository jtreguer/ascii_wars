import { CONFIG } from '../config.js';
import { DIRECTION_DELTA } from '../utils/constants.js';

export default class Disc {
  constructor(scene, gridManager) {
    this.scene = scene;
    this.gridManager = gridManager;
    this.col = 0;
    this.row = 0;
    this.direction = null;
    this.distanceTraveled = 0;
    this.active = false;

    this.text = scene.add.text(0, 0, CONFIG.DISC_CHAR, {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: CONFIG.CELL_FONT_SIZE,
      color: CONFIG.COLORS.ORANGE,
    }).setOrigin(0.5);
    this.text.setDepth(15);
    this.text.setVisible(false);
    this.text.setActive(false);

    scene.physics.add.existing(this.text);
    this.text.body.setSize(CONFIG.CELL_SIZE - 4, CONFIG.CELL_SIZE - 4);

    this.moveTimer = null;
  }

  fire(col, row, direction) {
    this.col = col;
    this.row = row;
    this.direction = direction;
    this.distanceTraveled = 0;
    this.active = true;

    const pos = this.gridManager.gridToPixel(col, row);
    this.text.setPosition(pos.x, pos.y);
    this.text.setVisible(true);
    this.text.setActive(true);
    this.text.setAlpha(1);

    // Check collision at starting cell (enemy 1 cell from player)
    this.scene.events.emit('disc-moved', this);
    if (!this.active) return;

    this._moveStep();
  }

  _moveStep() {
    if (!this.active) return;

    const delta = DIRECTION_DELTA[this.direction];
    const newCol = this.col + delta.dx;
    const newRow = this.row + delta.dy;

    if (!this.gridManager.isWalkable(newCol, newRow) || this.distanceTraveled >= CONFIG.DISC_MAX_RANGE) {
      this.deactivate();
      return;
    }

    this.col = newCol;
    this.row = newRow;
    this.distanceTraveled++;

    const target = this.gridManager.gridToPixel(newCol, newRow);
    this.scene.tweens.add({
      targets: this.text,
      x: target.x,
      y: target.y,
      duration: CONFIG.DISC_MOVE_SPEED,
      ease: 'Linear',
      onComplete: () => {
        // Check enemy collision at new position
        this.scene.events.emit('disc-moved', this);
        this._moveStep();
      },
    });
  }

  deactivate() {
    this.active = false;
    this.text.setVisible(false);
    this.text.setActive(false);
  }

  destroy() {
    this.text.destroy();
  }
}
