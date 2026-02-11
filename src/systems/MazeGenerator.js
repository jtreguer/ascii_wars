import { CELL_TYPE } from '../utils/constants.js';
import { shuffleArray, randomInt } from '../utils/math.js';

export default class MazeGenerator {
  generate(cols, rows, roomCount, roomMin, roomMax) {
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

    // Carve rooms onto the maze
    this._carveRooms(finalGrid, cols, rows, roomCount, roomMin, roomMax);

    // Carve a small room at the start so the player isn't boxed in
    this._carveRoom(finalGrid, 1, 1, 3, 3, cols, rows);

    return finalGrid;
  }

  _carveRooms(grid, cols, rows, count, minSize, maxSize) {
    // Collect floor cells as candidate room anchors
    const floors = [];
    for (let r = 2; r < rows - maxSize - 1; r++) {
      for (let c = 2; c < cols - maxSize - 1; c++) {
        if (grid[r][c] === CELL_TYPE.FLOOR) {
          floors.push({ col: c, row: r });
        }
      }
    }

    const shuffled = shuffleArray(floors);
    let placed = 0;

    for (const anchor of shuffled) {
      if (placed >= count) break;

      const w = randomInt(minSize, maxSize);
      const h = randomInt(minSize, maxSize);

      this._carveRoom(grid, anchor.col, anchor.row, w, h, cols, rows);
      placed++;
    }
  }

  _carveRoom(grid, startCol, startRow, width, height, cols, rows) {
    for (let r = startRow; r < startRow + height && r < rows - 1; r++) {
      for (let c = startCol; c < startCol + width && c < cols - 1; c++) {
        if (r > 0 && c > 0) {
          grid[r][c] = CELL_TYPE.FLOOR;
        }
      }
    }
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
