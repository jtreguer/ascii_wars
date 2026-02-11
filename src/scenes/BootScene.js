import { CONFIG } from '../config.js';

const SOUNDS = ['pew', 'death', 'triumph', 'token', 'kill', 'hit', 'bleep', 'bloop', 'speed'];

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    for (const name of SOUNDS) {
      this.load.audio(name, `assets/audio/${name}.wav`);
    }
  }

  create() {
    const cx = CONFIG.GAME_WIDTH / 2;
    const cy = CONFIG.GAME_HEIGHT / 2;

    this.add.text(cx, cy - 40, 'INITIALIZING...', {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '20px',
      color: CONFIG.COLORS.CYAN,
    }).setOrigin(0.5);

    // ASCII loading bar
    const barWidth = 30;
    this.barText = this.add.text(cx, cy + 10, '[' + '.'.repeat(barWidth) + ']', {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '16px',
      color: CONFIG.COLORS.GREEN,
    }).setOrigin(0.5);

    let progress = 0;
    this.time.addEvent({
      delay: 40,
      repeat: barWidth - 1,
      callback: () => {
        progress++;
        const filled = '='.repeat(progress);
        const empty = '.'.repeat(barWidth - progress);
        this.barText.setText('[' + filled + empty + ']');

        if (progress >= barWidth) {
          this.time.delayedCall(200, () => {
            this.scene.start('MenuScene');
          });
        }
      },
    });
  }
}
