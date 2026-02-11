import { CONFIG } from '../config.js';
import { TITLE_ART } from '../utils/ascii.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const cx = CONFIG.GAME_WIDTH / 2;

    // Title art
    this.add.text(cx, 160, TITLE_ART, {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '14px',
      color: CONFIG.COLORS.CYAN,
      align: 'center',
    }).setOrigin(0.5);

    // Instructions
    this.add.text(cx, 320, 'NAVIGATE THE LABYRINTH', {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '16px',
      color: CONFIG.COLORS.GREEN,
    }).setOrigin(0.5);

    this.add.text(cx, 400, [
      'ARROW KEYS - MOVE',
      'SPACE - THROW DISC',
      'COLLECT ALL [0] TOKENS',
      'REACH THE [X] EXIT',
      'AVOID [X] [+] ENEMIES',
    ].join('\n'), {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '14px',
      color: CONFIG.COLORS.WHITE,
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5);

    // Blinking prompt
    this.prompt = this.add.text(cx, 520, '>>> PRESS SPACE TO START <<<', {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '18px',
      color: CONFIG.COLORS.ORANGE,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.prompt,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Start on SPACE
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene', { level: 1, score: 0 });
      this.scene.launch('UIScene');
    });
  }
}
