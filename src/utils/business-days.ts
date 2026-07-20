function calcularPascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

const FERIADOS_FIXOS: { mes: number; dia: number }[] = [
  { mes: 1, dia: 1 },
  { mes: 4, dia: 21 },
  { mes: 5, dia: 1 },
  { mes: 9, dia: 7 },
  { mes: 10, dia: 12 },
  { mes: 11, dia: 2 },
  { mes: 11, dia: 15 },
  { mes: 12, dia: 25 },
];

function isFeriado(data: Date): boolean {
  const ano = data.getFullYear();
  const mes = data.getMonth() + 1;
  const dia = data.getDate();

  for (const f of FERIADOS_FIXOS) {
    if (f.mes === mes && f.dia === dia) return true;
  }

  const pascoa = calcularPascoa(ano);
  const pascoaMs = pascoa.getTime();

  const carnaval = new Date(pascoaMs - 47 * 86400000);
  if (carnaval.getMonth() + 1 === mes && carnaval.getDate() === dia) return true;

  const sextaSanta = new Date(pascoaMs - 2 * 86400000);
  if (sextaSanta.getMonth() + 1 === mes && sextaSanta.getDate() === dia) return true;

  const corpusChristi = new Date(pascoaMs + 60 * 86400000);
  if (corpusChristi.getMonth() + 1 === mes && corpusChristi.getDate() === dia) return true;

  return false;
}

function isFimDeSemana(data: Date): boolean {
  const dia = data.getDay();
  return dia === 0 || dia === 6;
}

function isDiaUtil(data: Date): boolean {
  return !isFimDeSemana(data) && !isFeriado(data);
}

export function proximoDiaUtil(data: Date): Date {
  const d = new Date(data);
  d.setHours(12, 0, 0, 0);
  while (!isDiaUtil(d)) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

export { isDiaUtil, isFeriado, isFimDeSemana };

export function formatarDataDDMMYYYY(data: Date): string {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}
