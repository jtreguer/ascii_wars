import { CONFIG } from '../config.js';
import { DIRECTION, DIRECTION_DELTA } from '../utils/constants.js';
import { manhattanDistance, shuffleArray } from '../utils/math.js';
import { findPath } from '../systems/Pathfinder.js';

export default class Snake {
  constructor(scene, gridManager, col, row, bodyPositions) {
    this.scene = scene;
    this.gridManager = gridManager;
    this.col = col;
    this.row = row;
    this.isMoving = false;
    this.alive = true;
    this.chasing = false;
    this.alertMode = false;

    // Patrol roaming
    this.patrolAnchor = { col, row };
    this.patrolMoveCount = 0;
    this.relocateThreshold = this._nextRelocateThreshold();

    // Body segments (index 0 = right behind head)
    this.segments = bodyPositions.map(pos => ({
      col: pos.col,
      row: pos.row,
    }));

    // Create head text
    const headPos = gridManager.gridToPixel(col, row);
    this.text = scene.add.text(headPos.x, headPos.y, CONFIG.SNAKE.HEAD_CHAR, {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: CONFIG.CELL_FONT_SIZE,
      color: CONFIG.SNAKE.COLOR,
    }).setOrigin(0.5);
    this.text.setDepth(10);

    // Create body segment texts
    this.segmentTexts = this.segments.map(seg => {
      const pos = gridManager.gridToPixel(seg.col, seg.row);
      const t = scene.add.text(pos.x, pos.y, CONFIG.SNAKE.BODY_CHAR, {
        fontFamily: CONFIG.FONT_FAMILY,
        fontSize: CONFIG.CELL_FONT_SIZE,
        color: CONFIG.SNAKE.COLOR,
      }).setOrigin(0.5);
      t.setDepth(10);
      return t;
    });

    // Spawn fade-in for head + all body segments
    const allTexts = [this.text, ...this.segmentTexts];
    for (const t of allTexts) {
      t.setAlpha(0);
      t.setScale(0.3);
      scene.tweens.add({
        targets: t,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: CONFIG.JUICE.SPAWN_FADE_DURATION,
        ease: 'Back.easeOut',
      });
    }

    // Start patrol timer
    this._scheduleMove();
  }

  _nextRelocateThreshold() {
    const s = CONFIG.SNAKE;
    return s.RELOCATE_MIN_MOVES +
      Math.floor(Math.random() * (s.RELOCATE_MAX_MOVES - s.RELOCATE_MIN_MOVES + 1));
  }

  _scheduleMove() {
    if (!this.alive) return;
    const s = CONFIG.SNAKE;
    const delay = this.chasing
      ? s.CHASE_SPEED + s.CHASE_PAUSE
      : s.MOVE_SPEED + s.PATROL_PAUSE;

    this.moveTimer = this.scene.time.delayedCall(delay, () => {
      this._move();
      this._scheduleMove();
    });
  }

  _move() {
    if (!this.alive || this.isMoving) return;

    const playerCol = this.scene.player?.col;
    const playerRow = this.scene.player?.row;
    const playerAlive = this.scene.player?.alive;
    const s = CONFIG.SNAKE;

    const chaseRange = this.alertMode ? s.CHASE_RANGE * 2 : s.CHASE_RANGE;
    const inRange = playerCol !== undefined && playerRow !== undefined && playerAlive &&
      manhattanDistance(this.col, this.row, playerCol, playerRow) <= chaseRange;

    // Update chase state
    if (this.alertMode) {
      const wasChasing = this.chasing;
      this.chasing = inRange;
      if (wasChasing && !this.chasing) {
        this.patrolAnchor = { col: this.col, row: this.row };
        this.patrolMoveCount = 0;
        this.relocateThreshold = this._nextRelocateThreshold();
      }
    } else if (inRange && !this.chasing) {
      this.chasing = true;
      this._setColor(s.CHASE_COLOR);
      this.scene.soundManager?.playAlertSiren();
      this.scene.tweens.add({
        targets: this.text,
        scaleX: CONFIG.JUICE.CHASE_PULSE_SCALE,
        scaleY: CONFIG.JUICE.CHASE_PULSE_SCALE,
        duration: CONFIG.JUICE.CHASE_PULSE_DURATION,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    } else if (!inRange && this.chasing) {
      this.chasing = false;
      this._setColor(s.COLOR);
      this.patrolAnchor = { col: this.col, row: this.row };
      this.patrolMoveCount = 0;
      this.relocateThreshold = this._nextRelocateThreshold();
    }

    let targetDir;
    if (inRange) {
      targetDir = this._chaseDirection(playerCol, playerRow);
    } else {
      this.patrolMoveCount++;
      if (this.patrolMoveCount >= this.relocateThreshold) {
        this._pickNewAnchor();
        this.patrolMoveCount = 0;
        this.relocateThreshold = this._nextRelocateThreshold();
      }
      targetDir = this._patrolDirection();
    }

    if (!targetDir) return;

    const delta = DIRECTION_DELTA[targetDir];
    const newCol = this.col + delta.dx;
    const newRow = this.row + delta.dy;

    if (!this.gridManager.isWalkable(newCol, newRow)) return;

    // Don't move head into own body
    for (const seg of this.segments) {
      if (seg.col === newCol && seg.row === newRow) return;
    }

    this.isMoving = true;

    // Snake movement: shift body segments
    const oldHeadCol = this.col;
    const oldHeadRow = this.row;

    // Move body: last segment takes position of previous, etc.
    for (let i = this.segments.length - 1; i > 0; i--) {
      this.segments[i].col = this.segments[i - 1].col;
      this.segments[i].row = this.segments[i - 1].row;
    }
    // First body segment takes old head position
    if (this.segments.length > 0) {
      this.segments[0].col = oldHeadCol;
      this.segments[0].row = oldHeadRow;
    }

    // Move head
    this.col = newCol;
    this.row = newRow;

    // Tween all parts to new positions
    const moveSpeed = this.chasing ? s.CHASE_SPEED : s.MOVE_SPEED;
    const headTarget = this.gridManager.gridToPixel(newCol, newRow);
    this.scene.tweens.add({
      targets: this.text,
      x: headTarget.x,
      y: headTarget.y,
      duration: moveSpeed,
      ease: 'Linear',
      onComplete: () => {
        this.isMoving = false;
      },
    });

    for (let i = 0; i < this.segments.length; i++) {
      const segTarget = this.gridManager.gridToPixel(this.segments[i].col, this.segments[i].row);
      this.scene.tweens.add({
        targets: this.segmentTexts[i],
        x: segTarget.x,
        y: segTarget.y,
        duration: moveSpeed,
        ease: 'Linear',
      });
    }
  }

  _setColor(color) {
    this.text.setColor(color);
    for (const t of this.segmentTexts) {
      t.setColor(color);
    }
  }

  _chaseDirection(playerCol, playerRow) {
    if (this.alertMode) {
      const path = findPath(this.gridManager, this.col, this.row, playerCol, playerRow);
      if (path && path.length > 0) {
        const next = path[0];
        const dx = next.col - this.col;
        const dy = next.row - this.row;
        for (const [dir, d] of Object.entries(DIRECTION_DELTA)) {
          if (d.dx === dx && d.dy === dy) return dir;
        }
      }
    }
    return this._moveToward(playerCol, playerRow) || this._randomWalkable();
  }

  _patrolDirection() {
    const dist = manhattanDistance(this.col, this.row, this.patrolAnchor.col, this.patrolAnchor.row);

    if (dist > CONFIG.SNAKE.PATROL_RADIUS) {
      const toward = this._moveToward(this.patrolAnchor.col, this.patrolAnchor.row);
      if (toward) return toward;
    }

    return this._randomWalkable();
  }

  _moveToward(targetCol, targetRow) {
    const dirs = [];
    if (targetRow < this.row) dirs.push(DIRECTION.UP);
    if (targetRow > this.row) dirs.push(DIRECTION.DOWN);
    if (targetCol < this.col) dirs.push(DIRECTION.LEFT);
    if (targetCol > this.col) dirs.push(DIRECTION.RIGHT);

    const shuffled = shuffleArray(dirs);
    for (const dir of shuffled) {
      const d = DIRECTION_DELTA[dir];
      if (this.gridManager.isWalkable(this.col + d.dx, this.row + d.dy)) {
        return dir;
      }
    }
    return null;
  }

  _randomWalkable() {
    const allDirs = shuffleArray([DIRECTION.UP, DIRECTION.DOWN, DIRECTION.LEFT, DIRECTION.RIGHT]);
    for (const dir of allDirs) {
      const d = DIRECTION_DELTA[dir];
      if (this.gridManager.isWalkable(this.col + d.dx, this.row + d.dy)) {
        return dir;
      }
    }
    return null;
  }

  _pickNewAnchor() {
    const dist = CONFIG.SNAKE.RELOCATE_DISTANCE;
    for (let attempt = 0; attempt < 10; attempt++) {
      const dx = Math.floor(Math.random() * (dist * 2 + 1)) - dist;
      const dy = Math.floor(Math.random() * (dist * 2 + 1)) - dist;
      const newCol = this.patrolAnchor.col + dx;
      const newRow = this.patrolAnchor.row + dy;
      if (manhattanDistance(this.col, this.row, newCol, newRow) >= 3 &&
          this.gridManager.isWalkable(newCol, newRow)) {
        this.patrolAnchor = { col: newCol, row: newRow };
        return;
      }
    }
  }

  occupiesCell(col, row) {
    if (this.col === col && this.row === row) return true;
    for (const seg of this.segments) {
      if (seg.col === col && seg.row === row) return true;
    }
    return false;
  }

  activateAlert() {
    if (!this.alive) return;
    this.alertMode = true;
    this.chasing = true;
    this._setColor(CONFIG.SNAKE.CHASE_COLOR);
  }

  die() {
    this.alive = false;
    if (this.moveTimer) this.moveTimer.destroy();
    this.cascadeTimers = [];

    // Cascade death: head first, then body segments with stagger
    this.text.setColor(CONFIG.SNAKE.CHASE_COLOR);
    this.scene.tweens.add({
      targets: this.text,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.text.setVisible(false);
        this.text.setActive(false);
      },
    });

    // Body segments explode one-by-one from head to tail
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const segText = this.segmentTexts[i];
      const timer = this.scene.time.delayedCall(CONFIG.JUICE.SNAKE_CASCADE_DELAY * (i + 1), () => {
        this.scene._spawnExplosion(seg.col, seg.row);
        this.scene.soundManager?.playEnemyKill();
        segText.setColor(CONFIG.SNAKE.CHASE_COLOR);
        this.scene.tweens.add({
          targets: segText,
          alpha: 0,
          scaleX: 1.5,
          scaleY: 1.5,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            segText.setVisible(false);
            segText.setActive(false);
          },
        });
      });
      this.cascadeTimers.push(timer);
    }
  }

  destroy() {
    if (this.moveTimer) this.moveTimer.destroy();
    if (this.cascadeTimers) this.cascadeTimers.forEach(t => t.destroy());
    this.text.destroy();
    for (const t of this.segmentTexts) {
      t.destroy();
    }
  }
}
