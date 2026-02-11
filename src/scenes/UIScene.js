import { CONFIG } from '../config.js';
import { EVENTS } from '../utils/constants.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    const style = {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '14px',
      color: CONFIG.COLORS.GREEN,
    };

    // Top HUD bar
    this.add.text(10, 4, 'SCORE:', style);
    this.scoreText = this.add.text(80, 4, '0', { ...style, color: CONFIG.COLORS.CYAN });

    this.add.text(250, 4, 'DISCS:', style);
    this.discsText = this.add.text(320, 4, '0', { ...style, color: CONFIG.COLORS.ORANGE });

    this.add.text(480, 4, 'LEVEL:', style);
    this.levelText = this.add.text(545, 4, '1', { ...style, color: CONFIG.COLORS.MAGENTA });

    this.add.text(650, 4, 'LIVES:', style);
    this.livesText = this.add.text(720, 4, '3', { ...style, color: CONFIG.COLORS.RED });

    // Listen for events from GameScene
    this.events.on(EVENTS.SCORE_CHANGED, (score) => {
      this.scoreText.setText(String(score));
    });

    this.events.on(EVENTS.DISCS_CHANGED, (discs) => {
      this.discsText.setText(String(discs));
    });

    this.events.on(EVENTS.LEVEL_CHANGED, (level) => {
      this.levelText.setText(String(level));
    });

    this.events.on(EVENTS.LIVES_CHANGED, (lives) => {
      this.livesText.setText(String(lives));
    });
  }

  shutdown() {
    this.events.off(EVENTS.SCORE_CHANGED);
    this.events.off(EVENTS.DISCS_CHANGED);
    this.events.off(EVENTS.LEVEL_CHANGED);
    this.events.off(EVENTS.LIVES_CHANGED);
  }
}
