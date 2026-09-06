export interface CueTrack {
  number: number;
  title: string;
  performer?: string;
  indexTime?: string; // MM:SS:FF (75 frames per sec)
  totalMs: number;
}

export interface CueSheet {
  albumTitle?: string;
  albumPerformer?: string;
  file?: string;
  tracks: CueTrack[];
}

export function parseCue(cueContent: string): CueSheet {
  const lines = cueContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const sheet: CueSheet = {
    tracks: [],
  };

  let currentTrack: Partial<CueTrack> | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('PERFORMER ') && !currentTrack) {
      sheet.albumPerformer = cleanQuotes(line.replace('PERFORMER ', ''));
    } else if (line.startsWith('TITLE ') && !currentTrack) {
      sheet.albumTitle = cleanQuotes(line.replace('TITLE ', ''));
    } else if (line.startsWith('FILE ')) {
      const match = line.match(/^FILE\s+"?([^"]+)"?\s+/i);
      if (match) sheet.file = match[1];
    } else if (line.startsWith('TRACK ')) {
      if (currentTrack && currentTrack.number !== undefined) {
        sheet.tracks.push({
          number: currentTrack.number,
          title: currentTrack.title || `Track ${currentTrack.number}`,
          performer: currentTrack.performer || sheet.albumPerformer,
          indexTime: currentTrack.indexTime || '00:00:00',
          totalMs: currentTrack.totalMs || 0,
        });
      }
      const parts = line.split(/\s+/);
      const trackNum = parseInt(parts[1], 10);
      currentTrack = {
        number: isNaN(trackNum) ? sheet.tracks.length + 1 : trackNum,
        totalMs: 0,
      };
    } else if (currentTrack) {
      if (line.startsWith('TITLE ')) {
        currentTrack.title = cleanQuotes(line.replace('TITLE ', ''));
      } else if (line.startsWith('PERFORMER ')) {
        currentTrack.performer = cleanQuotes(line.replace('PERFORMER ', ''));
      } else if (line.startsWith('INDEX 01 ') || line.startsWith('INDEX 1 ')) {
        const timeStr = line.replace(/INDEX\s+\d+\s+/, '').trim();
        currentTrack.indexTime = timeStr;
        currentTrack.totalMs = cueTimeToMs(timeStr);
      }
    }
  }

  if (currentTrack && currentTrack.number !== undefined) {
    sheet.tracks.push({
      number: currentTrack.number,
      title: currentTrack.title || `Track ${currentTrack.number}`,
      performer: currentTrack.performer || sheet.albumPerformer,
      indexTime: currentTrack.indexTime || '00:00:00',
      totalMs: currentTrack.totalMs || 0,
    });
  }

  return sheet;
}

function cleanQuotes(str: string): string {
  return str.trim().replace(/^["']|["']$/g, '');
}

function cueTimeToMs(cueTime: string): number {
  // MM:SS:FF (where FF is 0-74 frames, 75 frames per second)
  const parts = cueTime.split(':').map(p => parseInt(p, 10));
  if (parts.length < 2) return 0;
  const minutes = parts[0] || 0;
  const seconds = parts[1] || 0;
  const frames = parts[2] || 0;
  return minutes * 60000 + seconds * 1000 + Math.round((frames / 75) * 1000);
}

export function cueToLRC(sheet: CueSheet): string {
  const header = sheet.albumTitle ? `[ti:${sheet.albumTitle}]\n[ar:${sheet.albumPerformer || ''}]\n` : '';
  const lines = sheet.tracks.map(t => {
    const minutes = Math.floor(t.totalMs / 60000);
    const seconds = Math.floor((t.totalMs % 60000) / 1000);
    const centis = Math.floor((t.totalMs % 1000) / 10);
    const time = `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}]`;
    return `${time}${t.title}${t.performer ? ' - ' + t.performer : ''}`;
  });

  return header + lines.join('\n');
}

export function cueToYouTubeChapters(sheet: CueSheet): string {
  return sheet.tracks
    .map(t => {
      const minutes = Math.floor(t.totalMs / 60000);
      const seconds = Math.floor((t.totalMs % 60000) / 1000);
      const time = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      return `${time} ${t.title}${t.performer && t.performer !== sheet.albumPerformer ? ' (' + t.performer + ')' : ''}`;
    })
    .join('\n');
}

export function cueToM3U8(sheet: CueSheet): string {
  const lines = ['#EXTM3U'];
  sheet.tracks.forEach((t, i) => {
    const nextTrack = sheet.tracks[i + 1];
    const durationSec = nextTrack ? Math.round((nextTrack.totalMs - t.totalMs) / 1000) : 180;
    lines.push(`#EXTINF:${durationSec},${t.performer || sheet.albumPerformer || 'Artist'} - ${t.title}`);
    lines.push(`track_${String(t.number).padStart(2, '0')}.mp3`);
  });
  return lines.join('\n');
}

export function cueToJSON(sheet: CueSheet): string {
  return JSON.stringify(sheet, null, 2);
}

// Playlist conversions (M3U <-> PLS)
export interface PlaylistItem {
  title: string;
  duration?: number;
  uri: string;
}

export function parseM3U(content: string): PlaylistItem[] {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const items: PlaylistItem[] = [];
  let pendingTitle: string | undefined;
  let pendingDuration: number | undefined;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#EXTINF:')) {
      const info = line.replace('#EXTINF:', '');
      const commaIdx = info.indexOf(',');
      if (commaIdx !== -1) {
        pendingDuration = parseInt(info.substring(0, commaIdx), 10);
        pendingTitle = info.substring(commaIdx + 1).trim();
      } else {
        pendingTitle = info.trim();
      }
    } else if (!line.startsWith('#')) {
      items.push({
        title: pendingTitle || line,
        duration: pendingDuration,
        uri: line,
      });
      pendingTitle = undefined;
      pendingDuration = undefined;
    }
  }

  return items;
}

export function parsePLS(content: string): PlaylistItem[] {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const files: Record<number, string> = {};
  const titles: Record<number, string> = {};
  const lengths: Record<number, number> = {};

  for (const raw of lines) {
    const line = raw.trim();
    const fileMatch = line.match(/^File(\d+)=(.*)$/i);
    if (fileMatch) files[parseInt(fileMatch[1], 10)] = fileMatch[2];

    const titleMatch = line.match(/^Title(\d+)=(.*)$/i);
    if (titleMatch) titles[parseInt(titleMatch[1], 10)] = titleMatch[2];

    const lengthMatch = line.match(/^Length(\d+)=(.*)$/i);
    if (lengthMatch) lengths[parseInt(lengthMatch[1], 10)] = parseInt(lengthMatch[2], 10);
  }

  const result: PlaylistItem[] = [];
  const indices = Object.keys(files).map(Number).sort((a, b) => a - b);
  for (const idx of indices) {
    result.push({
      title: titles[idx] || files[idx],
      uri: files[idx],
      duration: lengths[idx],
    });
  }

  return result;
}

export function playlistToM3U(items: PlaylistItem[]): string {
  const lines = ['#EXTM3U'];
  for (const item of items) {
    lines.push(`#EXTINF:${item.duration || -1},${item.title}`);
    lines.push(item.uri);
  }
  return lines.join('\n');
}

export function playlistToPLS(items: PlaylistItem[]): string {
  const lines = ['[playlist]'];
  items.forEach((item, idx) => {
    const num = idx + 1;
    lines.push(`File${num}=${item.uri}`);
    lines.push(`Title${num}=${item.title}`);
    lines.push(`Length${num}=${item.duration || -1}`);
  });
  lines.push(`NumberOfEntries=${items.length}`);
  lines.push('Version=2');
  return lines.join('\n');
}
