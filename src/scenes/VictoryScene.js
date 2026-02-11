import { CONFIG } from '../config.js';
import { VICTORY_ART } from '../utils/ascii.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  init(data) {
    this.finalScore = data.score || 0;
  }

  create() {
    const cx = CONFIG.GAME_WIDTH / 2;

    this.add.text(cx, 120, VICTORY_ART, {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '16px',
      color: CONFIG.COLORS.YELLOW,
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(cx, 280, "YOU WON THE ASCII WARS", {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '22px',
      color: CONFIG.COLORS.CYAN,
    }).setOrigin(0.5);

    this.add.text(cx, 320, "YOU'RE THE NEW KING OF ASCIILAND", {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '18px',
      color: CONFIG.COLORS.GREEN,
    }).setOrigin(0.5);

    this.add.text(cx, 380, `FINAL SCORE: ${this.finalScore}`, {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '20px',
      color: CONFIG.COLORS.MAGENTA,
    }).setOrigin(0.5);

    // Blinking prompt
    this.prompt = this.add.text(cx, 480, '>>> PRESS SPACE TO RETURN TO MENU <<<', {
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

    // Ambient beep/boop sounds
    this._scheduleBleep();

    this.time.delayedCall(500, () => {
      this.input.keyboard.once('keydown-SPACE', () => {
        this._stopBleeps();
        this.scene.start('MenuScene');
      });
    });
  }

  _scheduleBleep() {
    const delay = 600 + Math.random() * 2000;
    this.bleepTimer = this.time.delayedCall(delay, () => {
      if (Math.random() > 0.4) {
        const rate = 0.6 + Math.random() * 1.4;
        this.sound.play('bleep', { volume: 0.06, rate });
      } else {
        const rate = 0.5 + Math.random() * 1.0;
        this.sound.play('bloop', { volume: 0.04, rate });
      }
      this._scheduleBleep();
    });
  }

  _stopBleeps() {
    if (this.bleepTimer) {
      this.bleepTimer.destroy();
      this.bleepTimer = null;
    }
  }

  shutdown() {
    this._stopBleeps();
  }
}
