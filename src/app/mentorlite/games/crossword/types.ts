export type Direction = 'across' | 'down';

export interface Word {
  id: string;
  number: number;
  direction: Direction;
  row: number;
  col: number;
  answer: string;
  clue: string;
}

export interface GridCell {
  row: number;
  col: number;
  isBlock: boolean;
  letter?: string;
  number?: number;
  isActive?: boolean;
  isPartOfActiveWord?: boolean;
}

export interface CrosswordData {
  id: string;
  title: string;
  subject: string; // Matéria
  topic: string;   // Assunto
  role: string;    // Cargo
  dimensions: {
    rows: number;
    cols: number;
  };
  words: Word[];
}

export type CellStatus = 'neutral' | 'correct' | 'incorrect';
