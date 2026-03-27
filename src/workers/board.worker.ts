import {
  calculateAdjacentValues,
  countRemainingFlags,
  isBoardSolvable,
  placeMines,
} from '@/services/board.service';
import type { Board, BoardConfig } from '@/types/game.types';

interface WorkerRequest {
  board: Board;
  config: BoardConfig;
  firstClickRow: number;
  firstClickCol: number;
  noGuess: boolean;
}

interface WorkerResponse {
  board: Board;
  minesRemaining: number;
}

self.addEventListener('message', (e: MessageEvent<WorkerRequest>) => {
  const { board, config, firstClickRow, firstClickCol, noGuess } = e.data;

  let resultBoard: Board | undefined;

  if (noGuess) {
    const MAX_ATTEMPTS = 100;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const mineBoard = placeMines(board, config, firstClickRow, firstClickCol);
      const valuedBoard = calculateAdjacentValues(mineBoard);
      if (isBoardSolvable(valuedBoard, [firstClickRow, firstClickCol])) {
        resultBoard = valuedBoard;
        break;
      }
    }
  }

  if (!resultBoard) {
    const mineBoard = placeMines(board, config, firstClickRow, firstClickCol);
    resultBoard = calculateAdjacentValues(mineBoard);
  }

  const response: WorkerResponse = {
    board: resultBoard,
    minesRemaining: countRemainingFlags(resultBoard, config.mines),
  };

  self.postMessage(response);
});
