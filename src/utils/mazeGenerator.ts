import { Cell, Difficulty, GameMode, ItemType, Position } from '../types/maze';

export function getGridDimensions(difficulty: Difficulty): { rows: number; cols: number } {
  switch (difficulty) {
    case 'easy':
      return { rows: 9, cols: 9 };
    case 'medium':
      return { rows: 15, cols: 15 };
    case 'hard':
      return { rows: 21, cols: 21 };
    case 'extreme':
      return { rows: 29, cols: 29 };
    default:
      return { rows: 15, cols: 15 };
  }
}

export function createEmptyGrid(rows: number, cols: number): Cell[][] {
  const grid: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
      });
    }
    grid.push(row);
  }
  return grid;
}

export function generateMaze(
  rows: number,
  cols: number,
  options: {
    braidProbability?: number; // 0 = perfect maze, 0.2 = some loops
    addItems?: boolean;
    mode?: GameMode;
  } = {}
): { grid: Cell[][]; startPos: Position; goalPos: Position } {
  const grid = createEmptyGrid(rows, cols);
  const stack: Cell[] = [];

  // Start generation from (0,0)
  const current = grid[0][0];
  current.visited = true;
  stack.push(current);

  const getUnvisitedNeighbors = (cell: Cell): { cell: Cell; dir: 'top' | 'right' | 'bottom' | 'left' }[] => {
    const { row, col } = cell;
    const neighbors: { cell: Cell; dir: 'top' | 'right' | 'bottom' | 'left' }[] = [];

    if (row > 0 && !grid[row - 1][col].visited) {
      neighbors.push({ cell: grid[row - 1][col], dir: 'top' });
    }
    if (col < cols - 1 && !grid[row][col + 1].visited) {
      neighbors.push({ cell: grid[row][col + 1], dir: 'right' });
    }
    if (row < rows - 1 && !grid[row + 1][col].visited) {
      neighbors.push({ cell: grid[row + 1][col], dir: 'bottom' });
    }
    if (col > 0 && !grid[row][col - 1].visited) {
      neighbors.push({ cell: grid[row][col - 1], dir: 'left' });
    }

    return neighbors;
  };

  const removeWalls = (a: Cell, b: Cell, dir: 'top' | 'right' | 'bottom' | 'left') => {
    if (dir === 'top') {
      a.walls.top = false;
      b.walls.bottom = false;
    } else if (dir === 'right') {
      a.walls.right = false;
      b.walls.left = false;
    } else if (dir === 'bottom') {
      a.walls.bottom = false;
      b.walls.top = false;
    } else if (dir === 'left') {
      a.walls.left = false;
      b.walls.right = false;
    }
  };

  while (stack.length > 0) {
    const currentCell = stack[stack.length - 1];
    const unvisited = getUnvisitedNeighbors(currentCell);

    if (unvisited.length > 0) {
      const next = unvisited[Math.floor(Math.random() * unvisited.length)];
      removeWalls(currentCell, next.cell, next.dir);
      next.cell.visited = true;
      stack.push(next.cell);
    } else {
      stack.pop();
    }
  }

  // Braid probability: remove some dead-end walls to create alternate paths if requested
  const braidProb = options.braidProbability ?? 0.15;
  if (braidProb > 0) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        const wallCount = [cell.walls.top, cell.walls.right, cell.walls.bottom, cell.walls.left].filter(Boolean).length;
        
        if (wallCount === 3 && Math.random() < braidProb) {
          // Dead end! Open one wall
          const possibleOpenings: ('top' | 'right' | 'bottom' | 'left')[] = [];
          if (r > 0 && cell.walls.top) possibleOpenings.push('top');
          if (c < cols - 1 && cell.walls.right) possibleOpenings.push('right');
          if (r < rows - 1 && cell.walls.bottom) possibleOpenings.push('bottom');
          if (c > 0 && cell.walls.left) possibleOpenings.push('left');

          if (possibleOpenings.length > 0) {
            const chosenDir = possibleOpenings[Math.floor(Math.random() * possibleOpenings.length)];
            let target: Cell | null = null;
            if (chosenDir === 'top') target = grid[r - 1][c];
            if (chosenDir === 'right') target = grid[r][c + 1];
            if (chosenDir === 'bottom') target = grid[r + 1][c];
            if (chosenDir === 'left') target = grid[r][c - 1];

            if (target) {
              removeWalls(cell, target, chosenDir);
            }
          }
        }
      }
    }
  }

  // Reset visited flag for gameplay/solver
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r][c].visited = false;
    }
  }

  const startPos: Position = { row: 0, col: 0 };

  // Find goal position using BFS to get maximum distance from start
  const distances = calculateDistancesFrom(grid, startPos, rows, cols);
  let maxDist = -1;
  let goalPos: Position = { row: rows - 1, col: cols - 1 };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (distances[r][c] > maxDist) {
        maxDist = distances[r][c];
        goalPos = { row: r, col: c };
      }
    }
  }

  // Add Items, Power-ups, Portals, Keys & Doors if requested
  if (options.addItems !== false) {
    populateItems(grid, startPos, goalPos, rows, cols, options.mode);
  }

  return { grid, startPos, goalPos };
}

function calculateDistancesFrom(grid: Cell[][], start: Position, rows: number, cols: number): number[][] {
  const dist: number[][] = Array.from({ length: rows }, () => Array(cols).fill(-1));
  const queue: Position[] = [start];
  dist[start.row][start.col] = 0;

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const cell = grid[curr.row][curr.col];
    const currentDist = dist[curr.row][curr.col];

    const moves: { r: number; c: number; dir: keyof Cell['walls'] }[] = [
      { r: curr.row - 1, c: curr.col, dir: 'top' },
      { r: curr.row, c: curr.col + 1, dir: 'right' },
      { r: curr.row + 1, c: curr.col, dir: 'bottom' },
      { r: curr.row, c: curr.col - 1, dir: 'left' },
    ];

    for (const move of moves) {
      if (!cell.walls[move.dir] && move.r >= 0 && move.r < rows && move.c >= 0 && move.c < cols) {
        if (dist[move.r][move.c] === -1) {
          dist[move.r][move.c] = currentDist + 1;
          queue.push({ row: move.r, col: move.c });
        }
      }
    }
  }

  return dist;
}

function populateItems(
  grid: Cell[][],
  start: Position,
  goal: Position,
  rows: number,
  cols: number,
  mode?: GameMode
) {
  const emptyCells: Position[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r === start.row && c === start.col) || (r === goal.row && c === goal.col)) {
        continue;
      }
      emptyCells.push({ row: r, col: c });
    }
  }

  // Shuffle empty cells
  for (let i = emptyCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
  }

  // Calculate shortest path to place key/door strategically if maze size is sufficient
  const solutionPath = findShortestPath(grid, start, goal, rows, cols);

  // Place Keys & Locked Doors on larger mazes
  if (rows >= 15 && solutionPath.length > 10) {
    const midPointIndex = Math.floor(solutionPath.length / 2);
    const doorCellPos = solutionPath[midPointIndex];

    // Key must be placed somewhere before door
    const keyCandidate = emptyCells.pop();
    if (keyCandidate) {
      grid[keyCandidate.row][keyCandidate.col].item = 'key';
      grid[keyCandidate.row][keyCandidate.col].itemColor = 'gold';

      grid[doorCellPos.row][doorCellPos.col].item = 'door';
      grid[doorCellPos.row][doorCellPos.col].itemColor = 'gold';
    }
  }

  // Place Portals if grid >= 15
  if (rows >= 15 && emptyCells.length >= 2) {
    const portalA = emptyCells.pop()!;
    const portalB = emptyCells.pop()!;

    grid[portalA.row][portalA.col].item = 'portal';
    grid[portalA.row][portalA.col].portalTarget = portalB;

    grid[portalB.row][portalB.col].item = 'portal';
    grid[portalB.row][portalB.col].portalTarget = portalA;
  }

  // Scatter coins
  const coinCount = Math.floor((rows * cols) / 12);
  for (let i = 0; i < coinCount && emptyCells.length > 0; i++) {
    const pos = emptyCells.pop()!;
    if (!grid[pos.row][pos.col].item) {
      grid[pos.row][pos.col].item = 'coin';
    }
  }

  // Scatter Speed Boosts
  const speedCount = Math.min(3, Math.floor(rows / 7));
  for (let i = 0; i < speedCount && emptyCells.length > 0; i++) {
    const pos = emptyCells.pop()!;
    if (!grid[pos.row][pos.col].item) {
      grid[pos.row][pos.col].item = 'speed';
    }
  }

  // Scatter Ghost mode / Wall pass items
  const ghostCount = Math.min(2, Math.floor(rows / 10));
  for (let i = 0; i < ghostCount && emptyCells.length > 0; i++) {
    const pos = emptyCells.pop()!;
    if (!grid[pos.row][pos.col].item) {
      grid[pos.row][pos.col].item = 'ghost';
    }
  }

  // Traps for time attack or monster chase
  if (mode === 'time-attack' || mode === 'monster-chase') {
    const trapCount = Math.floor(rows / 4);
    for (let i = 0; i < trapCount && emptyCells.length > 0; i++) {
      const pos = emptyCells.pop()!;
      if (!grid[pos.row][pos.col].item) {
        grid[pos.row][pos.col].item = 'trap';
      }
    }
  }
}

export function findShortestPath(
  grid: Cell[][],
  start: Position,
  goal: Position,
  rows: number,
  cols: number,
  ignoreDoors: boolean = false
): Position[] {
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent: (Position | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

  const queue: Position[] = [start];
  visited[start.row][start.col] = true;

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr.row === goal.row && curr.col === goal.col) {
      // Reconstruct path
      const path: Position[] = [];
      let step: Position | null = goal;
      while (step) {
        path.unshift(step);
        step = parent[step.row][step.col];
      }
      return path;
    }

    const cell = grid[curr.row][curr.col];
    const neighbors: { r: number; c: number; wall: keyof Cell['walls'] }[] = [
      { r: curr.row - 1, c: curr.col, wall: 'top' },
      { r: curr.row, c: curr.col + 1, wall: 'right' },
      { r: curr.row + 1, c: curr.col, wall: 'bottom' },
      { r: curr.row, c: curr.col - 1, wall: 'left' },
    ];

    for (const n of neighbors) {
      if (n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols) {
        if (!cell.walls[n.wall] && !visited[n.r][n.c]) {
          const neighborCell = grid[n.r][n.c];
          // Block path if it's a locked door and ignoreDoors is false
          if (!ignoreDoors && neighborCell.item === 'door') {
            continue;
          }
          visited[n.r][n.c] = true;
          parent[n.r][n.c] = curr;
          queue.push({ row: n.r, col: n.c });
        }
      }
    }
  }

  return [];
}
