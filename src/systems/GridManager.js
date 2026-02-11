import { CONFIG } from '../config.js';
import { CELL_TYPE } from '../utils/constants.js';
import { clamp } from '../utils/math.js';

export default class GridManager {
  constructor(grid) {
    this.grid = grid;
    this.cols = grid[0].length;
    this.rows = grid.length;
  }

  gridToPixel(col, row) {
    return {
      x: col * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2,
      y: row * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2,
    };
  }

  pixelToGrid(x, y) {
    return {
      col: Math.floor(x / CONFIG.CELL_SIZE),
      row: Math.floor(y / CONFIG.CELL_SIZE),
    };
  }

  isInBounds(col, row) {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  isWalkable(col, row) {
    if (!this.isInBounds(col, row)) return false;
    return this.grid[row][col] !== CELL_TYPE.WALL;
  }

  getCell(col, row) {
    if (!this.isInBounds(col, row)) return CELL_TYPE.WALL;
    return this.grid[row][col];
  }

  getNeighbors(col, row) {
    const neighbors = [];
    const deltas = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];
    for (const { dx, dy } of deltas) {
      const nc = col + dx;
      const nr = row + dy;
      if (this.isInBounds(nc, nr)) {
        neighbors.push({ col: nc, row: nr, type: this.grid[nr][nc] });
      }
    }
    return neighbors;
  }

  getWalkableNeighbors(col, row) {
    return this.getNeighbors(col, row).filter(n => n.type !== CELL_TYPE.WALL);
  }

  getFloorPositions() {
    const positions = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === CELL_TYPE.FLOOR) {
          positions.push({ col: c, row: r });
        }
      }
    }
    return positions;
  }
}
