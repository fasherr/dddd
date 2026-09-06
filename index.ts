export interface SubtitleCue {
  id?: string;
  startMs: number;
  endMs: number;
  text: string;
}

export function formatTimeSRT(ms: number): string {
  const safeMs = Math.max(0, Math.floor(ms));
  const hours = Math.floor(safeMs / 3600000);
  const minutes = Math.floor((safeMs % 3600000) / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  const millis = safeMs % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

export function formatTimeVTT(ms: number): string {
  const safeMs = Math.max(0, Math.floor(ms));
  const hours = Math.floor(safeMs / 3600000);
  const minutes = Math.floor((safeMs % 3600000) / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  const millis = safeMs % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

export function formatTimeASS(ms: number): string {
  const safeMs = Math.max(0, Math.floor(ms));
  const hours = Math.floor(safeMs / 3600000);
  const minutes = Math.floor((safeMs % 3600000) / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  const centis = Math.floor((safeMs % 1000) / 10);
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}

export function parseTimestamp(str: string): number {
  const trimmed = str.trim();
  // match HH:MM:SS[,.]mmm or MM:SS[,.]mmm
  const match = trimmed.match(/^(?:(?:(\d+):)?(\d{1,2}):)?(\d{1,2})[,\.](\d{1,3})/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  const millisStr = (match[4] || '0').padEnd(3, '0').slice(0, 3);
  const millis = parseInt(millisStr, 10);
  return hours * 3600000 + minutes * 60000 + seconds * 1000 + millis;
}

export function parseSRT(content: string): SubtitleCue[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const blocks = normalized.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    let timeLineIdx = 0;
    if (/^\d+$/.test(lines[0])) {
      timeLineIdx = 1;
    }
    if (timeLineIdx >= lines.length) continue;

    const timeLine = lines[timeLineIdx];
    const match = timeLine.match(/((?:\d+:)?\d+:\d+[,.]\d+)\s*-->\s*((?:\d+:)?\d+:\d+[,.]\d+)/);
    if (!match) continue;

    const startMs = parseTimestamp(match[1]);
    const endMs = parseTimestamp(match[2]);
    const textLines = lines.slice(timeLineIdx + 1);
    const text = textLines.join('\n');

    cues.push({
      startMs,
      endMs,
      text,
    });
  }

  return cues;
}

export function parseVTT(content: string): SubtitleCue[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  // Strip WEBVTT header and notes
  const lines = normalized.split('\n');
  const blocks: string[][] = [];
  let currentBlock: string[] = [];

  let inHeader = true;
  for (const line of lines) {
    const trimmed = line.trim();
    if (inHeader) {
      if (trimmed === '' || (!trimmed.startsWith('WEBVTT') && !trimmed.startsWith('NOTE') && !trimmed.startsWith('STYLE') && !trimmed.startsWith('REGION'))) {
        inHeader = false;
      } else {
        continue;
      }
    }

    if (trimmed === '') {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
        currentBlock = [];
      }
    } else {
      currentBlock.push(trimmed);
    }
  }
  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  const cues: SubtitleCue[] = [];
  for (const b of blocks) {
    let timeLineIdx = -1;
    for (let i = 0; i < b.length; i++) {
      if (b[i].includes('-->')) {
        timeLineIdx = i;
        break;
      }
    }
    if (timeLineIdx === -1) continue;

    const timeLine = b[timeLineIdx];
    const match = timeLine.match(/((?:\d+:)?\d+:\d+[,.]\d+)\s*-->\s*((?:\d+:)?\d+:\d+[,.]\d+)/);
    if (!match) continue;

    const startMs = parseTimestamp(match[1]);
    const endMs = parseTimestamp(match[2]);
    const text = b.slice(timeLineIdx + 1).join('\n');

    cues.push({
      startMs,
      endMs,
      text,
    });
  }

  return cues;
}

export function parseASS(content: string): SubtitleCue[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const cues: SubtitleCue[] = [];
  let inEvents = false;
  let formatFields: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('[Events]')) {
      inEvents = true;
      continue;
    }
    if (trimmed.startsWith('[') && inEvents) {
      inEvents = false;
    }

    if (inEvents) {
      if (trimmed.startsWith('Format:')) {
        formatFields = trimmed.replace('Format:', '').split(',').map(s => s.trim().toLowerCase());
      } else if (trimmed.startsWith('Dialogue:')) {
        const payload = trimmed.replace('Dialogue:', '').trim();
        const startIdx = formatFields.indexOf('start');
        const endIdx = formatFields.indexOf('end');
        const textIdx = formatFields.indexOf('text');

        const parts: string[] = [];
        let cur = '';
        let count = 0;
        const totalExpected = formatFields.length > 0 ? formatFields.length : 10;

        for (let i = 0; i < payload.length; i++) {
          if (payload[i] === ',' && count < totalExpected - 1) {
            parts.push(cur.trim());
            cur = '';
            count++;
          } else {
            cur += payload[i];
          }
        }
        parts.push(cur.trim());

        const startStr = startIdx !== -1 ? parts[startIdx] : parts[1];
        const endStr = endIdx !== -1 ? parts[endIdx] : parts[2];
        let text = textIdx !== -1 ? parts.slice(textIdx).join(',') : parts.slice(9).join(',');

        // Clean ASS override tags like {\an8\c&HFFFFFF&} and \N line breaks
        text = text.replace(/\{[^}]*\}/g, '').replace(/\\N/g, '\n').replace(/\\n/g, '\n').replace(/\\h/g, ' ');

        const startMs = parseTimestamp(startStr || '0');
        const endMs = parseTimestamp(endStr || '0');

        cues.push({
          startMs,
          endMs,
          text: text.trim(),
        });
      }
    }
  }

  return cues;
}

export function parseSBV(content: string): SubtitleCue[] {
  // YouTube format: 0:00:01.000,0:00:04.000\nText...
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const blocks = normalized.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    const match = lines[0].match(/((?:\d+:)?\d+:\d+[,.]\d+)\s*,\s*((?:\d+:)?\d+:\d+[,.]\d+)/);
    if (!match) continue;
    const startMs = parseTimestamp(match[1]);
    const endMs = parseTimestamp(match[2]);
    const text = lines.slice(1).join('\n');
    cues.push({ startMs, endMs, text });
  }

  return cues;
}

export function parseLRC(content: string): SubtitleCue[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const items: { ms: number; text: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const tagMatches = [...trimmed.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{2,3}))?\]/g)];
    if (tagMatches.length === 0) continue;

    const text = trimmed.replace(/\[\d{1,2}:\d{2}(?:[.:]\d{2,3})?\]/g, '').trim();
    for (const m of tagMatches) {
      const minutes = parseInt(m[1], 10);
      const seconds = parseInt(m[2], 10);
      const sub = (m[3] || '0').padEnd(3, '0').slice(0, 3);
      const ms = minutes * 60000 + seconds * 1000 + parseInt(sub, 10);
      items.push({ ms, text });
    }
  }

  items.sort((a, b) => a.ms - b.ms);
  const cues: SubtitleCue[] = [];
  for (let i = 0; i < items.length; i++) {
    const startMs = items[i].ms;
    const endMs = i + 1 < items.length ? items[i + 1].ms : startMs + 3500;
    cues.push({
      startMs,
      endMs,
      text: items[i].text,
    });
  }

  return cues;
}

// Generators
export function cuesToSRT(cues: SubtitleCue[]): string {
  return cues
    .map((cue, index) => {
      return `${index + 1}\n${formatTimeSRT(cue.startMs)} --> ${formatTimeSRT(cue.endMs)}\n${cue.text}\n`;
    })
    .join('\n');
}

export function cuesToVTT(cues: SubtitleCue[]): string {
  const body = cues
    .map((cue, index) => {
      return `${index + 1}\n${formatTimeVTT(cue.startMs)} --> ${formatTimeVTT(cue.endMs)}\n${cue.text}\n`;
    })
    .join('\n');
  return `WEBVTT - Converted via Specialized File Converter\n\n${body}`;
}

export function cuesToASS(cues: SubtitleCue[], title = 'Converted Subtitles'): string {
  const header = `[Script Info]
Title: ${title}
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: None

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const rows = cues.map(cue => {
    const start = formatTimeASS(cue.startMs);
    const end = formatTimeASS(cue.endMs);
    const textEscaped = cue.text.replace(/\n/g, '\\N');
    return `Dialogue: 0,${start},${end},Default,,0,0,0,,${textEscaped}`;
  });

  return header + rows.join('\n') + '\n';
}

export function cuesToSBV(cues: SubtitleCue[]): string {
  return cues
    .map(cue => {
      return `${formatTimeVTT(cue.startMs)},${formatTimeVTT(cue.endMs)}\n${cue.text}\n`;
    })
    .join('\n');
}

export function cuesToLRC(cues: SubtitleCue[]): string {
  return cues
    .map(cue => {
      const minutes = Math.floor(cue.startMs / 60000);
      const seconds = Math.floor((cue.startMs % 60000) / 1000);
      const centis = Math.floor((cue.startMs % 1000) / 10);
      const stamp = `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}]`;
      return `${stamp}${cue.text.replace(/\n/g, ' ')}`;
    })
    .join('\n');
}

export function cuesToTXT(cues: SubtitleCue[], withTime = false): string {
  if (withTime) {
    return cues
      .map(c => `[${formatTimeVTT(c.startMs)} - ${formatTimeVTT(c.endMs)}] ${c.text.replace(/\n/g, ' ')}`)
      .join('\n');
  }
  return cues.map(c => c.text).join('\n\n');
}

export function cuesToJSON(cues: SubtitleCue[]): string {
  return JSON.stringify(
    cues.map(c => ({
      start: c.startMs / 1000,
      end: c.endMs / 1000,
      startFormatted: formatTimeVTT(c.startMs),
      endFormatted: formatTimeVTT(c.endMs),
      text: c.text,
    })),
    null,
    2
  );
}
