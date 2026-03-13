import { CrosswordData, Word, Direction } from './types';

export function parseCrossword(text: string): CrosswordData[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const gamesMap = new Map<string, CrosswordData>();

  lines.forEach(line => {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 9) return; // Ignora linhas incompletas

    const subject = parts[0];
    const topic = parts[1];
    const role = parts[2];
    const title = parts[3];
    const dimRaw = parts[4]; // Ex: 10x10
    const dirRaw = parts[5].toUpperCase(); // H ou V
    const coordRaw = parts[6]; // Ex: 0,0
    const answer = parts[7].toUpperCase();
    const clue = parts[8];

    const direction: Direction = dirRaw === 'H' ? 'across' : 'down';
    const [row, col] = coordRaw.split(',').map(Number);
    const [rows, cols] = dimRaw.split('x').map(Number);

    // Usa o Título como chave para agrupar as palavras do mesmo jogo
    if (!gamesMap.has(title)) {
      gamesMap.set(title, {
        id: Math.random().toString(36).substring(2, 11),
        title,
        subject,
        topic,
        role,
        dimensions: { rows: rows || 10, cols: cols || 10 },
        words: []
      });
    }

    const game = gamesMap.get(title)!;
    
    // ID único baseado na posição e conteúdo
    const wordId = `${row}-${col}-${direction}-${answer.substring(0, 3)}-${Math.random().toString(36).substr(2, 4)}`;

    game.words.push({
      id: wordId,
      number: game.words.length + 1,
      direction,
      row,
      col,
      answer,
      clue
    });
  });

  return Array.from(gamesMap.values());
}

