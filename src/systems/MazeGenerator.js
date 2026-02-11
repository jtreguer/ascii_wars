import { CELL_TYPE } from '../utils/constants.js';
import { shuffleArray } from '../utils/math.js';

/**
 * Generates a maze using recursive backtracker algorithm.
 * Operates on a grid where odd-indexed cells are rooms and
 * even-indexed cells are walls/corridors between rooms.
 */
export default class MazeGenerator {
  generate(cols, rows) {
    // Ensure odd dimensions for proper maze structure
    const mazeCols = cols % 2 === 0 ? cols - 1 : cols;
    const mazeRows = rows % 2 === 0 ? rows - 1 : rows;

    // Fill with walls
    const grid = [];
    for (let r = 0; r < mazeRows; r++) {
      grid[r] = new Array(mazeCols).fill(CELL_TYPE.WALL);
    }

    // Carve passages using recursive backtracker (iterative stack)
    const startCol = 1;
    const startRow = 1;
    grid[startRow][startCol] = CELL_TYPE.FLOOR;

    const stack = [{ col: startCol, row: startRow }];

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const unvisited = this._getUnvisitedNeighbors(grid, current.col, current.row, mazeCols, mazeRows);

      if (unvisited.length === 0) {
        stack.pop();
      } else {
        const next = unvisited[Math.floor(Math.random() * unvisited.length)];
        // Carve the wall between current and next
        const wallCol = current.col + (next.col - current.col) / 2;
        const wallRow = current.row + (next.row - current.row) / 2;
        grid[wallRow][wallCol] = CELL_TYPE.FLOOR;
        grid[next.row][next.col] = CELL_TYPE.FLOOR;
        stack.push(next);
      }
    }

    // Pad to original dimensions if we shrunk
    const finalGrid = [];
    for (let r = 0; r < rows; r++) {
      finalGrid[r] = new Array(cols).fill(CELL_TYPE.WALL);
      if (r < mazeRows) {
        for (let c = 0; c < mazeCols && c < cols; c++) {
          finalGrid[r][c] = grid[r][c];
        }
      }
    }

    return finalGrid;
  }

  _getUnvisitedNeighbors(grid, col, row, mazeCols, mazeRows) {
    const neighbors = [];
    const deltas = [
      { dc: 0, dr: -2 },
      { dc: 0, dr: 2 },
      { dc: -2, dr: 0 },
      { dc: 2, dr: 0 },
    ];

    for (const { dc, dr } of deltas) {
      const nc = col + dc;
      const nr = row + dr;
      if (nc > 0 && nc < mazeCols && nr > 0 && nr < mazeRows && grid[nr][nc] === CELL_TYPE.WALL) {
        neighbors.push({ col: nc, row: nr });
      }
    }

    return shuffleArray(neighbors);
  }

  placeExit(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    // Place exit at the floor cell farthest from (1,1)
    let bestDist = 0;
    let exitPos = { col: cols - 2, row: rows - 2 };

    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        if (grid[r][c] === CELL_TYPE.FLOOR) {
          const dist = Math.abs(c - 1) + Math.abs(r - 1);
          if (dist > bestDist) {
            bestDist = dist;
            exitPos = { col: c, row: r };
          }
        }
      }
    }

    grid[exitPos.row][exitPos.col] = CELL_TYPE.EXIT;
    return exitPos;
  }

  getStartPosition() {
    return { col: 1, row: 1 };
  }

  getSpawnablePositions(grid, excludePositions = []) {
    const rows = grid.length;
    const cols = grid[0].length;
    const positions = [];
    const excludeSet = new Set(excludePositions.map(p => `${p.col},${p.row}`));

    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        if (grid[r][c] === CELL_TYPE.FLOOR && !excludeSet.has(`${c},${r}`)) {
          positions.push({ col: c, row: r });
        }
      }
    }

    return shuffleArray(positions);
  }
}
