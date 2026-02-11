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
    WALL: '#004444',
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

  // Enemy
  ENEMY_CHAR: 'E',
  ENEMY_MOVE_SPEED: 400, // ms per grid step
  ENEMY_CHASE_RANGE: 8, // cells manhattan distance
  ENEMY_PATROL_PAUSE: 600, // ms pause between patrol moves

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
};
