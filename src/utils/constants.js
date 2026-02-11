export const DIRECTION = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  NONE: 'none',
};

export const DIRECTION_DELTA = {
  [DIRECTION.UP]: { dx: 0, dy: -1 },
  [DIRECTION.DOWN]: { dx: 0, dy: 1 },
  [DIRECTION.LEFT]: { dx: -1, dy: 0 },
  [DIRECTION.RIGHT]: { dx: 1, dy: 0 },
};

export const CELL_TYPE = {
  WALL: 0,
  FLOOR: 1,
  EXIT: 2,
};

export const EVENTS = {
  SCORE_CHANGED: 'score-changed',
  DISCS_CHANGED: 'discs-changed',
  LEVEL_CHANGED: 'level-changed',
  PLAYER_DIED: 'player-died',
  LEVEL_COMPLETE: 'level-complete',
  TOKEN_COLLECTED: 'token-collected',
  ALL_TOKENS_COLLECTED: 'all-tokens-collected',
  ENEMY_KILLED: 'enemy-killed',
  LIVES_CHANGED: 'lives-changed',
  TIMER_CHANGED: 'timer-changed',
};
