import { describe, expect, test } from 'vitest';
import { dueDate, formatDueDate } from './emprestimos';

describe('CA-003-03 prazo de 14 dias úteis', () => {
  test('cruza Paixão de Cristo, Tiradentes e fins de semana', () => {
    expect(dueDate(new Date('2026-04-02T14:00:00Z')).toISOString()).toBe('2026-04-24T14:00:00.000Z');
  });

  test('conta a partir do dia seguinte e pula a Consciência Negra', () => {
    const due = dueDate(new Date('2026-11-13T14:30:00Z'));
    expect(due.toISOString()).toBe('2026-12-04T14:30:00.000Z');
    expect(formatDueDate(due)).toMatch(/04\/12\/2026.*11:30/);
  });

  test('preserva o horário local quando o instante em UTC cai em outro dia', () => {
    const due = dueDate(new Date('2026-12-18T02:20:00Z'));
    expect(due.toISOString()).toBe('2027-01-09T02:20:00.000Z');
    expect(formatDueDate(due)).toMatch(/08\/01\/2027.*23:20/);
  });

  test('conta Carnaval como dia útil por ser ponto facultativo', () => {
    expect(dueDate(new Date('2026-02-13T15:00:00Z')).toISOString()).toBe('2026-03-05T15:00:00.000Z');
  });
});
