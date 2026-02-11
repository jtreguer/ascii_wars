import { CONFIG } from '../config.js';
import { GAME_OVER_ART } from '../utils/ascii.js';
import { saveScore, getRank } from '../systems/Leaderboard.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalLevel = data.level || 1;
  }

  create() {
    const cx = CONFIG.GAME_WIDTH / 2;

    this.add.text(cx, 100, GAME_OVER_ART, {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '16px',
      color: CONFIG.COLORS.RED,
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(cx, 230, `FINAL SCORE: ${this.finalScore}`, {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '20px',
      color: CONFIG.COLORS.CYAN,
    }).setOrigin(0.5);

    this.add.text(cx, 260, `REACHED LEVEL: ${this.finalLevel}`, {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '14px',
      color: CONFIG.COLORS.GREEN,
    }).setOrigin(0.5);

    // Ambient beep/boop sounds
    this._scheduleBleep();

    // Show name entry — leaderboard and restart prompt come after
    this._showNameEntry(cx, 295);
  }

  _showNameEntry(cx, y) {
    this.nameChars = [];
    this.nameCursor = 0;

    this.nameLabel = this.add.text(cx, y, 'ENTER YOUR NAME:', {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '14px',
      color: CONFIG.COLORS.YELLOW,
    }).setOrigin(0.5);

    this.nameTexts = [];
    const slotSpacing = 28;
    const startX = cx - slotSpacing;
    for (let i = 0; i < 3; i++) {
      const txt = this.add.text(startX + i * slotSpacing, y + 28, '_', {
        fontFamily: CONFIG.FONT_FAMILY,
        fontSize: '22px',
        color: CONFIG.COLORS.CYAN,
      }).setOrigin(0.5);
      this.nameTexts.push(txt);
    }

    // Blink current slot
    this.nameBlink = this.tweens.add({
      targets: this.nameTexts[0],
      alpha: 0.2,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    this.nameKeyHandler = (event) => {
      const key = event.key.toUpperCase();
      if (key.length === 1 && key >= 'A' && key <= 'Z' && this.nameCursor < 3) {
        this.nameBlink.stop();
        this.nameTexts[this.nameCursor].setAlpha(1);
        this.nameTexts[this.nameCursor].setText(key);
        this.nameChars.push(key);
        this.nameCursor++;
        this.sound.play('bleep', { volume: 0.08, rate: 1.5 });

        if (this.nameCursor < 3) {
          this.nameBlink = this.tweens.add({
            targets: this.nameTexts[this.nameCursor],
            alpha: 0.2,
            duration: 400,
            yoyo: true,
            repeat: -1,
          });
        } else {
          this.input.keyboard.off('keydown', this.nameKeyHandler);
          this.time.delayedCall(400, () => this._onNameEntered(this.nameChars.join('')));
        }
      } else if (event.key === 'Backspace' && this.nameCursor > 0) {
        this.nameBlink.stop();
        if (this.nameCursor < 3) {
          this.nameTexts[this.nameCursor].setAlpha(1);
        }
        this.nameCursor--;
        this.nameChars.pop();
        this.nameTexts[this.nameCursor].setText('_');
        this.sound.play('bloop', { volume: 0.05, rate: 0.8 });

        this.nameBlink = this.tweens.add({
          targets: this.nameTexts[this.nameCursor],
          alpha: 0.2,
          duration: 400,
          yoyo: true,
          repeat: -1,
        });
      }
    };

    this.input.keyboard.on('keydown', this.nameKeyHandler);
  }

  _onNameEntered(name) {
    const cx = CONFIG.GAME_WIDTH / 2;

    // Remove name entry UI
    if (this.nameBlink) this.nameBlink.stop();
    this.nameLabel.destroy();
    this.nameTexts.forEach(t => t.destroy());

    // Save score and show leaderboard
    const scores = saveScore(this.finalScore, this.finalLevel, false, name);
    const rank = getRank(scores, this.finalScore);
    this._buildLeaderboard(cx, 290, scores, rank);

    // Blinking restart prompt
    this.prompt = this.add.text(cx, 560, '>>> PRESS SPACE TO RESTART <<<', {
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

    this.time.delayedCall(300, () => {
      this.input.keyboard.once('keydown-SPACE', () => {
        this._stopBleeps();
        this.scene.start('MenuScene');
      });
    });
  }

  _buildLeaderboard(cx, topY, scores, currentRank) {
    if (scores.length === 0) return;

    this.add.text(cx, topY, '- LEADERBOARD -', {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '14px',
      color: CONFIG.COLORS.YELLOW,
    }).setOrigin(0.5);

    const listTop = topY + 22;
    const visibleHeight = 220;
    const rowH = 20;
    const totalHeight = scores.length * rowH;

    // Container for all entries
    const container = this.add.container(0, 0);

    for (let i = 0; i < scores.length; i++) {
      const entry = scores[i];
      const y = listTop + i * rowH;
      const rankStr = String(i + 1).padStart(2, ' ');
      const nameStr = entry.name || '???';
      const scoreStr = String(entry.score).padStart(7, ' ');
      const lvlStr = `L${entry.level}`;
      const tag = entry.won ? ' WIN' : '';
      const isCurrent = i === currentRank;

      const color = isCurrent ? CONFIG.COLORS.CYAN : CONFIG.COLORS.WHITE;
      const prefix = isCurrent ? '>' : ' ';

      const text = this.add.text(cx, y, `${prefix}${rankStr}. ${nameStr} ${scoreStr}  ${lvlStr}${tag}`, {
        fontFamily: CONFIG.FONT_FAMILY,
        fontSize: '13px',
        color,
      }).setOrigin(0.5);

      container.add(text);
    }

    // Mask to clip the visible area
    const mask = this.add.rectangle(cx, listTop + visibleHeight / 2, 400, visibleHeight, 0x000000).setVisible(false);
    container.setMask(mask.createGeometryMask());

    // Auto-scroll if content exceeds visible area
    if (totalHeight > visibleHeight) {
      const scrollDist = totalHeight - visibleHeight;
      this.tweens.add({
        targets: container,
        y: -scrollDist,
        duration: scores.length * 1200,
        delay: 1500,
        ease: 'Linear',
        yoyo: true,
        repeat: -1,
        hold: 2000,
      });
    }
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
