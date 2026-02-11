import { manhattanDistance } from '../utils/math.js';

// Binary min-heap keyed on f-score
class MinHeap {
  constructor() {
    this._data = [];
  }

  get size() {
    return this._data.length;
  }

  push(node) {
    this._data.push(node);
    this._bubbleUp(this._data.length - 1);
  }

  pop() {
    const top = this._data[0];
    const last = this._data.pop();
    if (this._data.length > 0) {
      this._data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this._data[i].f < this._data[parent].f) {
        [this._data[i], this._data[parent]] = [this._data[parent], this._data[i]];
        i = parent;
      } else break;
    }
  }

  _sinkDown(i) {
    const len = this._data.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < len && this._data[l].f < this._data[smallest].f) smallest = l;
      if (r < len && this._data[r].f < this._data[smallest].f) smallest = r;
      if (smallest === i) break;
      [this._data[i], this._data[smallest]] = [this._data[smallest], this._data[i]];
      i = smallest;
    }
  }
}

/**
 * A* pathfinding on the grid.
 * Returns array of {col, row} from start (exclusive) to goal (inclusive), or null.
 */
export function findPath(gridManager, startCol, startRow, goalCol, goalRow) {
  const cols = gridManager.cols;
  const key = (c, r) => r * cols + c;
  const colFromKey = (k) => k % cols;
  const rowFromKey = (k) => (k / cols) | 0;

  const open = new MinHeap();
  const gScore = new Map();
  const cameFrom = new Map(); // childKey -> parentKey
  const closed = new Set();

  const startKey = key(startCol, startRow);
  const goalKey = key(goalCol, goalRow);
  gScore.set(startKey, 0);
  open.push({ col: startCol, row: startRow, f: manhattanDistance(startCol, startRow, goalCol, goalRow) });

  while (open.size > 0) {
    const current = open.pop();
    const ck = key(current.col, current.row);

    if (ck === goalKey) {
      // Reconstruct path (start exclusive, goal inclusive)
      const path = [];
      let k = ck;
      while (k !== startKey) {
        path.push({ col: colFromKey(k), row: rowFromKey(k) });
        k = cameFrom.get(k);
      }
      path.reverse();
      return path;
    }

    if (closed.has(ck)) continue;
    closed.add(ck);

    const neighbors = gridManager.getWalkableNeighbors(current.col, current.row);
    const g = gScore.get(ck);

    for (const n of neighbors) {
      const nk = key(n.col, n.row);
      if (closed.has(nk)) continue;

      const tentG = g + 1;
      const prevG = gScore.get(nk);
      if (prevG !== undefined && tentG >= prevG) continue;

      gScore.set(nk, tentG);
      cameFrom.set(nk, ck);
      open.push({ col: n.col, row: n.row, f: tentG + manhattanDistance(n.col, n.row, goalCol, goalRow) });
    }
  }

  return null;
}
