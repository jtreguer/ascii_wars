import { CONFIG } from '../config.js';

export default class Token {
  constructor(scene, gridManager, col, row) {
    this.scene = scene;
    this.gridManager = gridManager;
    this.col = col;
    this.row = row;
    this.collected = false;

    const pos = gridManager.gridToPixel(col, row);
    this.text = scene.add.text(pos.x, pos.y, CONFIG.TOKEN_CHAR, {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: CONFIG.CELL_FONT_SIZE,
      color: CONFIG.COLORS.YELLOW,
    }).setOrigin(0.5);
    this.text.setDepth(5);

    scene.physics.add.existing(this.text);
    this.text.body.setSize(CONFIG.CELL_SIZE - 4, CONFIG.CELL_SIZE - 4);

    // Pulsing animation
    this.pulseTween = scene.tweens.add({
      targets: this.text,
      alpha: 0.4,
      duration: CONFIG.TOKEN_PULSE_DURATION,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  collect() {
    if (this.collected) return;
    this.collected = true;
    this.pulseTween.stop();

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
    if (this.pulseTween) this.pulseTween.stop();
    this.text.destroy();
  }
}
