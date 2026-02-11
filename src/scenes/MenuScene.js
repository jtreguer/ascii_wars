import { CONFIG } from '../config.js';
import { TITLE_ART } from '../utils/ascii.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const cx = CONFIG.GAME_WIDTH / 2;
    const style = (size, color) => ({
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: size,
      color,
    });

    // Title art
    this.add.text(cx, 130, TITLE_ART, {
      ...style('14px', CONFIG.COLORS.CYAN),
      align: 'center',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(cx, 268, 'NAVIGATE THE LABYRINTH', style('16px', CONFIG.COLORS.GREEN)).setOrigin(0.5);

    // --- Legend section with animated entities ---
    const legendX = cx - 120;
    const labelX = cx - 90;
    let y = 305;
    const rowH = 24;

    // Controls
    this.add.text(cx, y, 'ARROW KEYS - MOVE    SPACE - AIM    P - PAUSE', {
      ...style('12px', CONFIG.COLORS.DARK_GRAY),
      align: 'center',
    }).setOrigin(0.5);
    y += rowH + 4;

    // Token
    this.add.text(legendX, y, CONFIG.TOKEN_CHAR, style('18px', CONFIG.COLORS.YELLOW)).setOrigin(0.5);
    this.add.text(labelX, y, 'Collect all tokens', style('14px', CONFIG.COLORS.WHITE)).setOrigin(0, 0.5);
    y += rowH;

    // Exit
    this.add.text(legendX, y, CONFIG.MAZE_EXIT_CHAR, style('18px', CONFIG.COLORS.EXIT_UNLOCKED)).setOrigin(0.5);
    this.add.text(labelX, y, 'Reach the exit', style('14px', CONFIG.COLORS.WHITE)).setOrigin(0, 0.5);
    y += rowH;

    // Enemies (animated)
    this._enemyCharIndex = 0;
    this.enemyText = this.add.text(legendX, y, CONFIG.ENEMY_CHARS[0], style('18px', CONFIG.COLORS.MAGENTA)).setOrigin(0.5);
    this.add.text(labelX, y, 'Avoid enemies', style('14px', CONFIG.COLORS.WHITE)).setOrigin(0, 0.5);
    this.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => {
        this._enemyCharIndex = (this._enemyCharIndex + 1) % CONFIG.ENEMY_CHARS.length;
        this.enemyText.setText(CONFIG.ENEMY_CHARS[this._enemyCharIndex]);
      },
    });
    y += rowH;

    // Speed bonus (animated S/s)
    this._speedCharIndex = 0;
    this.speedText = this.add.text(legendX, y, CONFIG.SPEED_BONUS.CHARS[0], style('18px', CONFIG.COLORS.WHITE)).setOrigin(0.5);
    this.add.text(labelX, y, 'Speed boost (x2)', style('14px', CONFIG.COLORS.WHITE)).setOrigin(0, 0.5);
    this.time.addEvent({
      delay: CONFIG.SPEED_BONUS.SWAP_INTERVAL,
      loop: true,
      callback: () => {
        this._speedCharIndex = 1 - this._speedCharIndex;
        this.speedText.setText(CONFIG.SPEED_BONUS.CHARS[this._speedCharIndex]);
      },
    });
    y += rowH;

    // Disc carrier (animated blink white/orange)
    this._carrierColorIndex = 0;
    this.carrierText = this.add.text(legendX, y, CONFIG.DISC_CARRIER.CHAR, style('18px', CONFIG.COLORS.WHITE)).setOrigin(0.5);
    this.add.text(labelX, y, 'Replenish discs', style('14px', CONFIG.COLORS.WHITE)).setOrigin(0, 0.5);
    this.time.addEvent({
      delay: CONFIG.DISC_CARRIER.BLINK_INTERVAL,
      loop: true,
      callback: () => {
        this._carrierColorIndex = 1 - this._carrierColorIndex;
        this.carrierText.setColor(this._carrierColorIndex === 0 ? CONFIG.COLORS.WHITE : CONFIG.COLORS.ORANGE);
      },
    });
    y += rowH + 8;

    // Blinking prompt
    this.prompt = this.add.text(cx, y + 20, '>>> PRESS SPACE TO START <<<', style('18px', CONFIG.COLORS.ORANGE)).setOrigin(0.5);
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

    // Start on SPACE
    this.input.keyboard.once('keydown-SPACE', () => {
      this._stopBleeps();
      this.scene.start('GameScene', { level: 1, score: 0 });
      this.scene.launch('UIScene');
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
