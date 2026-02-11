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

    // Top HUD bar — row 1
    this.add.text(10, 4, 'SCORE:', style);
    this.scoreText = this.add.text(80, 4, '0', { ...style, color: CONFIG.COLORS.CYAN });

    this.add.text(250, 4, 'DISCS:', style);
    this.discsText = this.add.text(320, 4, '0', { ...style, color: CONFIG.COLORS.ORANGE });

    this.add.text(480, 4, 'LEVEL:', style);
    this.levelText = this.add.text(545, 4, '1', { ...style, color: CONFIG.COLORS.MAGENTA });

    this.add.text(650, 4, 'LIVES:', style);
    this.livesText = this.add.text(720, 4, '3', { ...style, color: CONFIG.COLORS.RED });

    // Timer — bottom right
    this.timerText = this.add.text(CONFIG.GAME_WIDTH - 10, CONFIG.GAME_HEIGHT - 8, '0:00', {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '16px',
      color: CONFIG.COLORS.WHITE,
    }).setOrigin(1, 1);

    // Multiplier hint next to timer
    this.multiplierText = this.add.text(CONFIG.GAME_WIDTH - 70, CONFIG.GAME_HEIGHT - 8, 'x10', {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '16px',
      color: CONFIG.COLORS.YELLOW,
    }).setOrigin(1, 1);

    // Bonus popup (hidden until level complete)
    this.bonusText = this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 40, '', {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '24px',
      color: CONFIG.COLORS.YELLOW,
      align: 'center',
    }).setOrigin(0.5).setAlpha(0).setDepth(100);

    // Pause overlay (hidden by default)
    this.pauseOverlay = this.add.rectangle(
      CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2,
      CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT,
      0x000000, 0.6,
    ).setDepth(200).setVisible(false);

    this.pauseText = this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 20, '- PAUSED -', {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '28px',
      color: CONFIG.COLORS.YELLOW,
      align: 'center',
    }).setOrigin(0.5).setDepth(201).setVisible(false);

    this.pauseHint = this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 + 20, 'PRESS P TO RESUME', {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '14px',
      color: CONFIG.COLORS.WHITE,
    }).setOrigin(0.5).setDepth(201).setVisible(false);

    this.paused = false;
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.pauseKey.on('down', () => {
      if (!this.paused) return;
      this.paused = false;
      this.pauseOverlay.setVisible(false);
      this.pauseText.setVisible(false);
      this.pauseHint.setVisible(false);
      this.scene.resume('GameScene');
    });

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

    this.events.on(EVENTS.TIMER_CHANGED, (seconds) => {
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      this.timerText.setText(`${min}:${String(sec).padStart(2, '0')}`);

      // Update multiplier hint color based on current tier
      let mult = CONFIG.TIME_BONUS_DEFAULT;
      for (const tier of CONFIG.TIME_BONUS) {
        if (seconds < tier.maxSeconds) {
          mult = tier.multiplier;
          break;
        }
      }
      this.multiplierText.setText(`x${mult}`);
      if (mult >= 10) this.multiplierText.setColor(CONFIG.COLORS.YELLOW);
      else if (mult >= 5) this.multiplierText.setColor(CONFIG.COLORS.GREEN);
      else if (mult >= 3) this.multiplierText.setColor(CONFIG.COLORS.ORANGE);
      else this.multiplierText.setColor(CONFIG.COLORS.RED);
    });

    this.events.on('pause-game', () => {
      this.paused = true;
      this.pauseOverlay.setVisible(true);
      this.pauseText.setVisible(true);
      this.pauseHint.setVisible(true);
    });

    this.events.on('show-bonus', (timeBonus, multiplier, discBonus, discsLeft) => {
      let lines = `TIME  +${timeBonus} (x${multiplier})`;
      if (discBonus > 0) {
        lines += `\nDISCS +${discBonus} (${discsLeft} left)`;
      }
      this.bonusText.setText(lines);
      this.bonusText.setY(CONFIG.GAME_HEIGHT / 2 - 40);
      this.bonusText.setAlpha(1);
      this.tweens.add({
        targets: this.bonusText,
        alpha: 0,
        y: CONFIG.GAME_HEIGHT / 2 - 80,
        duration: 2500,
        delay: 800,
        ease: 'Power2',
      });
    });
  }

  shutdown() {
    this.events.off(EVENTS.SCORE_CHANGED);
    this.events.off(EVENTS.DISCS_CHANGED);
    this.events.off(EVENTS.LEVEL_CHANGED);
    this.events.off(EVENTS.LIVES_CHANGED);
    this.events.off(EVENTS.TIMER_CHANGED);
    this.events.off('show-bonus');
    this.events.off('pause-game');
    if (this.pauseKey) this.pauseKey.removeAllListeners();
  }
}
