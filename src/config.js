export const CONFIG = {
  // Dev
  DEV_MODE: true,

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
  PLAYER_CHAR: '\u1330', // ጰ (Ethiopic syllable pha)
  PLAYER_MOVE_SPEED: 120, // ms per grid step (tween duration)
  PLAYER_INITIAL_DISCS: 6,
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
  DISC_COLOR: '#88ffff',
  DISC_CHAR: 'o',
  DISC_MOVE_SPEED: 60, // ms per grid step
  DISC_MAX_RANGE: 15, // cells before despawn
  DISC_POOL_SIZE: 10,

  // Speed Bonus
  SPEED_BONUS: {
    CHARS: ['S', 's'],
    SWAP_INTERVAL: 500,    // ms between S/s alternation
    DURATION: 10000,       // ms of 2x speed
    MULTIPLIER: 2,
    MIN_LEVEL: 2,
    TWO_MIN_LEVEL: 4,     // level at which 2 speed bonuses spawn
    VOLUME: 0.25,
  },

  // Disc Carrier
  DISC_CARRIER: {
    CHAR: 'o',
    BLINK_INTERVAL: 400,   // ms between white/orange blink
    MOVE_SPEED: 600,       // ms per grid step (slow)
    MOVE_PAUSE: 800,       // ms pause between moves
    PATROL_RADIUS: 5,
    MIN_LEVEL: 5,
    TWO_MIN_LEVEL: 8,     // level at which 2 disc carriers spawn
    VOLUME: 0.25,
  },

  // Snake enemy
  SNAKE: {
    HEAD_CHAR: '\u03A3',   // Σ (uppercase sigma)
    BODY_CHAR: '\u03C3',   // σ (lowercase sigma)
    BODY_LENGTH: 3,
    BODY_LENGTH_LEVEL_8: 4,
    MOVE_SPEED: 500,       // ms per grid step (patrol)
    CHASE_SPEED: 180,      // ms per grid step (chase)
    CHASE_RANGE: 6,        // cells manhattan distance
    PATROL_PAUSE: 700,     // ms pause between patrol moves
    CHASE_PAUSE: 80,       // ms pause between chase moves
    PATROL_RADIUS: 5,
    RELOCATE_MIN_MOVES: 5,
    RELOCATE_MAX_MOVES: 10,
    RELOCATE_DISTANCE: 5,
    COLOR: '#00ff00',
    CHASE_COLOR: '#ff0000',
    KILL_SCORE: 500,
    SEGMENT_SCORE: 100,              // per body segment destroyed
    SPEED_BOOST_PER_LOST_SEGMENT: 0.12, // 12% faster per lost segment
    STUCK_THRESHOLD: 10000,           // ms stuck before eating a wall
    WOBBLE_DURATION: 2000,            // ms of wobbling before the bite
    WOBBLE_ANGLE: 0.3,               // radians oscillation amplitude
    EAT_CHARS: ['#', '*', '.', '\u00B7'],  // debris chars when wall is eaten
    EAT_PARTICLE_COUNT: 6,
    EAT_PARTICLE_SPREAD: 16,
    EAT_PARTICLE_DURATION: 400,
    MIN_LEVEL: 4,
    TWO_MIN_LEVEL: 7,
  },

  // Disc glow
  DISC_GLOW: [
    { radius: 1, color: '#66cccc' },
  ],

  // Enemy alert glow
  ENEMY_ALERT_GLOW: [
    { radius: 1, color: '#bb0000' },  // inner — brightest red
    { radius: 2, color: '#770000' },  // outer — dimmer red
  ],

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
  MAX_LEVEL: 10,
  LEVEL: {
    BASE_ENEMIES: 3,
    ENEMIES_PER_LEVEL: 1,
    BASE_TOKENS: 5,
    TOKENS_PER_LEVEL: 2,
    MAX_ENEMIES: 12,
    MAX_TOKENS: 20,
    DISCS_PER_LEVEL: 6,
  },

  // Scoring
  ENEMY_KILL_SCORE: 250,
  SPEED_BONUS_SCORE: 2500,
  DISC_CARRIER_SCORE: 5000,
  LEVEL_COMPLETE_BONUS: 500,
  TIME_BONUS: [
    { maxSeconds: 30, multiplier: 10 },
    { maxSeconds: 60, multiplier: 5 },
    { maxSeconds: 90, multiplier: 3 },
    { maxSeconds: 120, multiplier: 2 },
  ],
  TIME_BONUS_DEFAULT: 1,
  DISC_BONUS: [0, 100, 250, 500, 750, 1000, 1500], // indexed by discs remaining (0–6)
  LEVEL_RECAP_DURATION: 2800, // ms to show bonus recap before next level

  // Juice effects
  JUICE: {
    // Score popup
    POPUP_RISE: 30,
    POPUP_DURATION: 1200,
    POPUP_DELAY: 200,
    POPUP_FONT_SIZE: '14px',

    // Screen shake on kill
    KILL_SHAKE_DURATION: 100,
    KILL_SHAKE_INTENSITY: 0.006,

    // ASCII explosion
    EXPLODE_CHARS: ['*', '#', '!', '~', '+', 'x'],
    EXPLODE_COUNT: 5,
    EXPLODE_SPREAD: 20,
    EXPLODE_DURATION: 350,

    // Chase pulse
    CHASE_PULSE_SCALE: 1.4,
    CHASE_PULSE_DURATION: 150,

    // Player trail
    TRAIL_CHAR: '.',
    TRAIL_DURATION: 300,
    TRAIL_ALPHA: 0.4,
    TRAIL_COLOR: '#007777',
    TRAIL_SPEED_COLOR: '#777777',

    // Token magnet
    MAGNET_DURATION: 100,

    // Disc kill trail (particle burst per cell)
    DISC_TRAIL_CHARS: ['o', '*', '~', '\u00B7', '.', '+', '\u2022', '\u00B0'],  // o * ~ · . + • °
    DISC_TRAIL_PARTICLES_PER_CELL: 3,
    DISC_TRAIL_SCATTER: 8,         // px random offset from cell center
    DISC_TRAIL_DURATION: 500,
    DISC_TRAIL_ALPHA: 0.7,
    DISC_TRAIL_STAGGER: 25,
    DISC_TRAIL_COLORS: ['#88ffff', '#55dddd', '#33aaaa', '#116666'],

    // Snake death cascade
    SNAKE_CASCADE_DELAY: 80,

    // Enemy/snake spawn fade-in
    SPAWN_FADE_DURATION: 400,

    // Disc wall-hit sparks
    SPARK_CHARS: ['\u00B7', '*', '.'],  // ·, *, .
    SPARK_COUNT: 3,
    SPARK_SPREAD: 10,
    SPARK_DURATION: 250,
  },

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

      WALL_HIT_VOLUME: 0.20,

      ALERT_FREQ_LOW: 400,            // Hz — siren low frequency
      ALERT_FREQ_HIGH: 900,           // Hz — siren high frequency
      ALERT_DURATION: 0.5,            // seconds
      ALERT_SWEEPS: 3,                // number of up-down sweeps
      ALERT_VOLUME: 0.12,
    },
  },
};
