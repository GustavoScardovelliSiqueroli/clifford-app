import { ref } from 'vue';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface CobrancaExtraItem {
  motivo: string;
  valor: number;
}

export interface CobrancaParaCompartilhar {
  id: number;
  nome: string;
  telefone: string;
  valor_mensalidade: number;
  total_extras: number;
  vencimento: string;
  data_pagamento: string | null;
  competencia: string;
  extras: CobrancaExtraItem[];
}

const LOGO_PATH = '/assets/logo.png';
const W = 440;
const PAD = 32;
const LOGO_W = 250;

const FONE_CLIFFORD = '(18) 99792-3799';

function fmt(val: number): string {
  return val.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(s: string): string {
  if (!s) return '—';
  const d = new Date(s + 'T12:00:00');
  return d.toLocaleDateString('pt-BR');
}

function fmtCompetencia(s: string): string {
  if (!s) return '';
  const parts = s.split('-');
  const ano = parts[0] ?? '';
  const mes = parts[1] ?? '1';
  const meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return `${meses[Math.min(Math.max(parseInt(mes, 10) - 1, 0), 11)]} / ${ano}`;
}

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function carregarLogo(): Promise<string | null> {
  try {
    const r = await fetch(LOGO_PATH);
    const blob = await r.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts?: {
    color?: string;
    size?: number;
    bold?: boolean;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
  },
): void {
  ctx.font = `${opts?.bold ? 'bold ' : ''}${opts?.size ?? 14}px Roboto, Helvetica, Arial, sans-serif`;
  ctx.textAlign = opts?.align ?? 'left';
  ctx.textBaseline = opts?.baseline ?? 'top';
  ctx.fillStyle = opts?.color ?? '#ffffff';
  ctx.fillText(text, x, y);
}

async function gerarPngDataUrl(cobranca: CobrancaParaCompartilhar): Promise<string> {
  const logoDataUrl = await carregarLogo();
  let logoImg: HTMLImageElement | null = null;
  if (logoDataUrl) {
    try {
      logoImg = await carregarImagem(logoDataUrl);
    } catch {
      logoImg = null;
    }
  }

  const total = cobranca.valor_mensalidade + cobranca.total_extras;
  const pago = !!cobranca.data_pagamento;

  const cellH = 26;
  const accentColor = '#fbac25';
  const labelColor = '#555555';
  const valueColor = '#1a1a1a';

  const logoH = logoImg ? Math.min(LOGO_W, (LOGO_W / logoImg.width) * logoImg.height) : 0;
  const logoAreaH = logoH > 0 ? logoH + 24 : 0;

  const extrasCount = cobranca.extras.length;
  const extrasH = extrasCount > 0 ? extrasCount * cellH + 4 : 0;

  const headerH = PAD + logoAreaH + 22 + 18 + 24;

  const bodyH =
    20 + 28 * 4 + 8 + 16 + cellH + 4 + extrasH + 16 + 40 + (pago ? 48 : 0) + 16 + 20 + 24;

  const contentH = headerH + bodyH;

  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = contentH * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, W, contentH);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, headerH);

  let y = PAD;

  if (logoImg) {
    const lw = LOGO_W;
    const lh = (LOGO_W / logoImg.width) * logoImg.height;
    ctx.drawImage(logoImg, (W - lw) / 2, y, lw, lh);
    y += lh + 24;
  }

  drawText(ctx, 'Artes Plásticas / Artes Visuais', W / 2, y, {
    size: 15,
    bold: true,
    color: '#ffffff',
    align: 'center',
  });
  y += 22;
  drawText(ctx, 'Cursos: Aquarela / Desenho / Pintura em Tela', W / 2, y, {
    size: 12,
    color: '#cccccc',
    align: 'center',
  });
  y += 36;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, y, W, bodyH);

  y += 20;

  y = drawInfoLine(ctx, 'Aluno:', cobranca.nome, y);
  y = drawInfoLine(ctx, 'Telefone:', cobranca.telefone || '—', y);
  y = drawInfoLine(ctx, 'Competência:', fmtCompetencia(cobranca.competencia), y);
  y = drawInfoLine(ctx, 'Vencimento:', fmtDate(cobranca.vencimento), y);
  y += 8;

  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  y += 16;

  drawValueLine(ctx, 'Mensalidade', fmt(cobranca.valor_mensalidade), y, valueColor, labelColor);
  y += cellH + 4;

  for (const extra of cobranca.extras) {
    drawValueLine(ctx, extra.motivo, fmt(extra.valor), y, accentColor, '#888888');
    y += cellH;
  }

  if (extrasCount > 0) {
    y += 4;
  }

  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += 16;

  ctx.font = 'bold 20px Roboto, Helvetica, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = valueColor;
  ctx.fillText('TOTAL', PAD, y);
  ctx.textAlign = 'right';
  ctx.fillStyle = accentColor;
  ctx.fillText(fmt(total), W - PAD, y);
  y += 40;

  if (pago) {
    const badgeW = 160;
    const badgeH = 28;
    const badgeX = (W - badgeW) / 2;
    ctx.fillStyle = '#e8f5e9';
    roundRect(ctx, badgeX, y, badgeW, badgeH, 14);
    ctx.fill();
    drawText(ctx, `Pago em ${fmtDate(cobranca.data_pagamento!)}`, W / 2, y + 6, {
      size: 13,
      bold: true,
      color: '#2e7d32',
      align: 'center',
    });
    y += badgeH + 20;
  }

  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, y, W, 60);
  y += 16;

  drawText(ctx, 'Clifford Ateliê • desde 1995', W / 2, y, {
    size: 14,
    bold: true,
    align: 'center',
    color: valueColor,
  });
  drawText(ctx, `WhatsApp: ${FONE_CLIFFORD}`, W / 2, y + 20, {
    size: 12,
    align: 'center',
    color: labelColor,
  });

  return canvas.toDataURL('image/png');
}

function drawInfoLine(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  y: number,
): number {
  ctx.font = '15px Roboto, Helvetica, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#555555';
  ctx.fillText(label, PAD, y);
  const lw = ctx.measureText(label).width;
  ctx.fillStyle = '#1a1a1a';
  ctx.fillText(value, PAD + lw + 8, y);
  return y + 28;
}

function drawValueLine(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  y: number,
  valueColor: string,
  lblColor?: string,
): void {
  ctx.font = '14px Roboto, Helvetica, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = lblColor ?? (label === 'Mensalidade' ? '#555555' : '#888888');
  ctx.fillText(label, PAD, y);
  ctx.textAlign = 'right';
  ctx.fillStyle = valueColor;
  ctx.fillText(value, W - PAD, y);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export function useCompartilharCobranca() {
  const gerando = ref(false);

  async function compartilhar(cobranca: CobrancaParaCompartilhar): Promise<void> {
    if (gerando.value) return;
    gerando.value = true;

    try {
      const dataUrl = await gerarPngDataUrl(cobranca);
      const base64 = dataUrl.split(',')[1] ?? dataUrl;
      const fileName = `cobranca-${cobranca.id}.png`;

      const saved = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });

      await Share.share({
        title: `Cobrança - ${cobranca.nome}`,
        url: saved.uri,
        dialogTitle: 'Compartilhar cobrança',
      });

      Filesystem.deleteFile({
        path: fileName,
        directory: Directory.Cache,
      }).catch(() => {});
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error('Erro ao compartilhar cobrança:', error);
      throw error;
    } finally {
      gerando.value = false;
    }
  }

  return { compartilhar, gerando };
}
