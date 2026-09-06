/**
 * Syndication & Developer Format Converters
 * OPML (.opml) <-> JSON, Markdown, M3U
 * Properties (.properties) <-> JSON, YAML, ENV
 * NDJSON / JSON Lines (.ndjson, .jsonl) <-> JSON, CSV
 * SQL INSERT Dumps (.sql) <-> JSON, CSV
 */

export interface OpmlOutline {
  text: string;
  title?: string;
  type?: string;
  xmlUrl?: string;
  htmlUrl?: string;
  children?: OpmlOutline[];
}

export function parseOPML(content: string): { title: string; outlines: OpmlOutline[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'application/xml');
  const title = doc.querySelector('title')?.textContent || 'OPML Export';

  function extractOutlines(parentElement: Element): OpmlOutline[] {
    const list: OpmlOutline[] = [];
    const directOutlines = Array.from(parentElement.children).filter(
      c => c.tagName.toLowerCase() === 'outline'
    );

    for (const el of directOutlines) {
      const outline: OpmlOutline = {
        text: el.getAttribute('text') || el.getAttribute('title') || 'Untitled',
        title: el.getAttribute('title') || undefined,
        type: el.getAttribute('type') || undefined,
        xmlUrl: el.getAttribute('xmlUrl') || undefined,
        htmlUrl: el.getAttribute('htmlUrl') || undefined,
      };

      const children = extractOutlines(el);
      if (children.length > 0) {
        outline.children = children;
      }
      list.push(outline);
    }
    return list;
  }

  const body = doc.querySelector('body');
  const outlines = body ? extractOutlines(body) : [];
  return { title, outlines };
}

export function opmlToMarkdown(data: { title: string; outlines: OpmlOutline[] }): string {
  const lines: string[] = [`# ${data.title}\n`];

  function recurse(outlines: OpmlOutline[], depth = 0) {
    const indent = '  '.repeat(depth);
    for (const o of outlines) {
      const link = o.xmlUrl ? ` ([RSS/Feed](${o.xmlUrl}))` : o.htmlUrl ? ` ([Web](${o.htmlUrl}))` : '';
      lines.push(`${indent}- **${o.text}**${link}`);
      if (o.children && o.children.length > 0) {
        recurse(o.children, depth + 1);
      }
    }
  }

  recurse(data.outlines, 0);
  return lines.join('\n');
}

export function opmlToM3U(data: { title: string; outlines: OpmlOutline[] }): string {
  const lines = ['#EXTM3U'];

  function recurse(outlines: OpmlOutline[]) {
    for (const o of outlines) {
      if (o.xmlUrl) {
        lines.push(`#EXTINF:-1,${o.title || o.text}`);
        lines.push(o.xmlUrl);
      }
      if (o.children) recurse(o.children);
    }
  }

  recurse(data.outlines);
  return lines.join('\n');
}

// Java .properties parser
export function parseProperties(content: string): Record<string, string> {
  const res: Record<string, string> = {};
  const lines = content.split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('!')) continue;

    const sepIndex = line.search(/[=:]/);
    if (sepIndex !== -1) {
      const key = line.substring(0, sepIndex).trim();
      const val = line.substring(sepIndex + 1).trim();
      res[key] = val;
    }
  }
  return res;
}

// NDJSON parser
export function parseNDJSON(content: string): any[] {
  return content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map((line, idx) => {
      try {
        return JSON.parse(line);
      } catch {
        return { _raw: line, _error: `Invalid JSON at line ${idx + 1}` };
      }
    });
}

export function jsonToNDJSON(arr: any[]): string {
  if (!Array.isArray(arr)) arr = [arr];
  return arr.map(item => JSON.stringify(item)).join('\n');
}

// SQL INSERT parser
export function parseSQLInserts(content: string): Record<string, any>[] {
  const rows: Record<string, any>[] = [];
  // Matches INSERT INTO table (col1, col2) VALUES (v1, v2), (v3, v4);
  const regex = /INSERT\s+INTO\s+[`"]?(\w+)[`"]?\s*\(([^)]+)\)\s*VALUES\s*([^;]+);/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const cols = match[2].split(',').map(c => c.trim().replace(/[`"']/g, ''));
    const valuesPart = match[3];

    // Split rows inside VALUES (...), (...)
    const rowMatches = valuesPart.match(/\(([^)]+)\)/g);
    if (rowMatches) {
      for (const rm of rowMatches) {
        const rawVals = rm.slice(1, -1);
        // Simple comma split respecting quotes
        const vals: string[] = [];
        let inQuotes = false;
        let cur = '';
        for (let i = 0; i < rawVals.length; i++) {
          const char = rawVals[i];
          if (char === "'" && rawVals[i - 1] !== '\\') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            vals.push(cur.trim().replace(/^'|'$/g, ''));
            cur = '';
            continue;
          }
          cur += char;
        }
        vals.push(cur.trim().replace(/^'|'$/g, ''));

        const rowObj: Record<string, any> = {};
        cols.forEach((col, idx) => {
          rowObj[col] = vals[idx] !== undefined ? vals[idx] : null;
        });
        rows.push(rowObj);
      }
    }
  }

  return rows;
}
