export const CONFIG = {
  // Display
  GAME_WIDTH: 800,
  GAME_HEIGHT: 600,
  CELL_SIZE: 20,
  GRID_COLS: 40,
  GRID_ROWS: 30,

  // Colors (hex strings for Phaser text)
  COLORS: {
    BLACK: '#000000',
    CYAN: '#00ffff',
    MAGENTA: '#ff00ff',
    ORANGE: '#ff8800',
    GREEN: '#00ff00',
    RED: '#ff0000',
    WHITE: '#ffffff',
    YELLOW: '#ffff00',
    DARK_GRAY: '#333333',
    WALL: '#003333',
    WALL_GLOW: [
      { radius: 1, color: '#00bbbb' },  // inner — brightest
      { radius: 2, color: '#007777' },  // middle
      { radius: 3, color: '#005555' },  // outer — dimmest
    ],
    FLOOR: '#000000',
    EXIT_LOCKED: '#444444',
    EXIT_UNLOCKED: '#00ff00',
  },

  // Colors as numeric (for tint / graphics)
  TINT: {
    CYAN: 0x00ffff,
    MAGENTA: 0xff00ff,
    ORANGE: 0xff8800,
    GREEN: 0x00ff00,
    RED: 0xff0000,
    WHITE: 0xffffff,
  },

  // Font
  FONT_FAMILY: 'Courier New, Courier, monospace',
  FONT_SIZE: '16px',
  CELL_FONT_SIZE: '18px',

  // Player
  PLAYER_CHAR: '@',
  PLAYER_MOVE_SPEED: 120, // ms per grid step (tween duration)
  PLAYER_INITIAL_DISCS: 3,
  PLAYER_LIVES: 3,
  RESPAWN_DELAY: 1200,       // ms before respawn after death
  RESPAWN_INVULN_DURATION: 1600, // ms of invulnerability after respawn

  // Enemy
  ENEMY_CHARS: ['X', '+'],
  ENEMY_CHASE_CHARS: ['X', '*', '+', '*'],
  ENEMY_MOVE_SPEED: 400, // ms per grid step
  ENEMY_CHASE_SPEED: 220, // ms per grid step when chasing
  ENEMY_CHASE_RANGE: 8, // cells manhattan distance
  ENEMY_PATROL_PAUSE: 600, // ms pause between patrol moves
  ENEMY_CHASE_PAUSE: 100, // ms pause between chase moves
  ENEMY_PATROL_RADIUS: 4, // cells — max wander distance from anchor before steering back
  ENEMY_RELOCATE_MIN_MOVES: 6,  // min patrol moves before picking a new anchor
  ENEMY_RELOCATE_MAX_MOVES: 14, // max patrol moves before picking a new anchor
  ENEMY_RELOCATE_DISTANCE: 6,   // max cell offset when choosing new anchor
  ENEMY_MIN_SPAWN_DISTANCE: 6,  // min manhattan distance from player start

  // Disc
  DISC_CHAR: 'o',
  DISC_MOVE_SPEED: 60, // ms per grid step
  DISC_MAX_RANGE: 15, // cells before despawn
  DISC_POOL_SIZE: 10,

  // Token
  TOKEN_CHAR: '0',
  TOKEN_PULSE_DURATION: 800, // ms for pulse animation
  TOKEN_SCORE: 100,

  // Maze
  MAZE_WALL_CHAR: '#',
  MAZE_FLOOR_CHAR: ' ',
  MAZE_EXIT_CHAR: 'X',
  MAZE_BORDER: 1, // cells of border wall
  ROOM_COUNT: 6, // rooms to carve after maze generation
  ROOM_MIN_SIZE: 2, // min width/height of a room
  ROOM_MAX_SIZE: 5, // max width/height of a room

  // Level progression
  LEVEL: {
    BASE_ENEMIES: 3,
    ENEMIES_PER_LEVEL: 1,
    BASE_TOKENS: 5,
    TOKENS_PER_LEVEL: 2,
    MAX_ENEMIES: 12,
    MAX_TOKENS: 20,
    DISCS_PER_LEVEL: 3,
  },

  // Scoring
  ENEMY_KILL_SCORE: 250,
  LEVEL_COMPLETE_BONUS: 500,
  TIME_BONUS: [
    { maxSeconds: 30, multiplier: 10 },
    { maxSeconds: 60, multiplier: 5 },
    { maxSeconds: 90, multiplier: 3 },
    { maxSeconds: 120, multiplier: 2 },
  ],
  TIME_BONUS_DEFAULT: 1,
  DISC_BONUS: [0, 150, 500, 1000], // indexed by discs remaining (0, 1, 2, 3)
  LEVEL_RECAP_DURATION: 2800, // ms to show bonus recap before next level

  // Audio
  AUDIO: {
    MASTER_VOLUME: 0.3,
    AMBIENT: {
      DRONE_FREQUENCY: 55,        // Hz (A1)
      DRONE_VOLUME: 0.07,
      DRONE_FILTER_FREQ: 200,     // Hz lowpass cutoff
      DRONE_FILTER_Q: 2,
      DRONE_LFO_RATE: 0.15,       // Hz — slow pulsing
      DRONE_LFO_DEPTH: 100,       // Hz modulation range
      BLEEP_INTERVAL_MIN: 500,    // ms between random sounds
      BLEEP_INTERVAL_MAX: 2500,
      BLEEP_VOLUME: 0.08,
      BLOOP_VOLUME: 0.06,
    },
    SFX: {
      DEATH_NOTES: [330, 262, 220],     // E4 → C4 → A3 descending
      DEATH_NOTE_DURATION: 0.18,
      DEATH_NOTE_GAP: 0.08,
      DEATH_VOLUME: 0.15,

      TRIUMPH_NOTES: [523, 659, 784, 1047], // C5 → E5 → G5 → C6
      TRIUMPH_NOTE_DURATION: 0.15,
      TRIUMPH_NOTE_GAP: 0.05,
      TRIUMPH_FINAL_SUSTAIN: 0.4,
      TRIUMPH_VOLUME: 0.12,

      TOKEN_FREQUENCY: 1319,            // E6
      TOKEN_DETUNE: 8,                  // Hz offset for chorus shimmer
      TOKEN_DURATION: 0.18,
      TOKEN_VOLUME: 0.25,

      PEW_FREQUENCY: 1200,             // Hz start — high pitched zap
      PEW_FREQUENCY_END: 300,          // Hz end — sweeps down fast
      PEW_DURATION: 0.18,
      PEW_VOLUME: 0.30,

      KILL_FREQUENCY: 440,             // Hz base — ascending zap
      KILL_DURATION: 0.15,
      KILL_VOLUME: 0.20,

      HIT_FREQUENCY: 180,              // Hz — low buzz impact
      HIT_DURATION: 0.35,
      HIT_VOLUME: 0.25,

      ALERT_FREQ_LOW: 400,            // Hz — siren low frequency
      ALERT_FREQ_HIGH: 900,           // Hz — siren high frequency
      ALERT_DURATION: 0.5,            // seconds
      ALERT_SWEEPS: 3,                // number of up-down sweeps
      ALERT_VOLUME: 0.12,
    },
  },
};
