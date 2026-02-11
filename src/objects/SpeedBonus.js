import { CONFIG } from '../config.js';

export default class SpeedBonus {
  constructor(scene, gridManager, col, row) {
    this.scene = scene;
    this.gridManager = gridManager;
    this.col = col;
    this.row = row;
    this.collected = false;
    this._charIndex = 0;

    const pos = gridManager.gridToPixel(col, row);
    this.text = scene.add.text(pos.x, pos.y, CONFIG.SPEED_BONUS.CHARS[0], {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: CONFIG.CELL_FONT_SIZE,
      color: CONFIG.COLORS.WHITE,
    }).setOrigin(0.5);
    this.text.setDepth(5);

    // Alternate between S and s
    this.swapTimer = scene.time.addEvent({
      delay: CONFIG.SPEED_BONUS.SWAP_INTERVAL,
      loop: true,
      callback: () => {
        if (this.collected) return;
        this._charIndex = 1 - this._charIndex;
        this.text.setText(CONFIG.SPEED_BONUS.CHARS[this._charIndex]);
      },
    });
  }

  collect() {
    if (this.collected) return;
    this.collected = true;
    this.swapTimer.destroy();

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
    if (this.swapTimer) this.swapTimer.destroy();
    this.text.destroy();
  }
}
