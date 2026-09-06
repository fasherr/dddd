/**
 * Scientific & Bibliographic Format Converters
 * BibTeX (.bib) <-> RIS (.ris), JSON, CSV, Markdown
 */

export interface BibEntry {
  type: string;
  citeKey: string;
  title: string;
  author: string;
  year: string;
  journal?: string;
  booktitle?: string;
  publisher?: string;
  volume?: string;
  number?: string;
  pages?: string;
  doi?: string;
  url?: string;
  abstract?: string;
}

export function parseBibTeX(content: string): BibEntry[] {
  const entries: BibEntry[] = [];
  // Regex to match @type{key, ...}
  const entryRegex = /@([a-zA-Z]+)\s*\{\s*([^,\s]+)\s*,([^@]*)\}/gs;
  let match: RegExpExecArray | null;

  while ((match = entryRegex.exec(content)) !== null) {
    const type = match[1].toLowerCase();
    const citeKey = match[2].trim();
    const body = match[3];

    const entry: BibEntry = {
      type,
      citeKey,
      title: '',
      author: '',
      year: '',
    };

    // Extract fields: field = {value} or field = "value" or field = 123
    const fieldRegex = /([a-zA-Z0-9_-]+)\s*=\s*(?:\{([^}]*)\}|"([^"]*)"|([^\s,}]+))/g;
    let fieldMatch: RegExpExecArray | null;

    while ((fieldMatch = fieldRegex.exec(body)) !== null) {
      const field = fieldMatch[1].toLowerCase();
      const val = (fieldMatch[2] ?? fieldMatch[3] ?? fieldMatch[4] ?? '').trim().replace(/\s+/g, ' ');

      if (field === 'title') entry.title = val;
      else if (field === 'author') entry.author = val;
      else if (field === 'year') entry.year = val;
      else if (field === 'journal') entry.journal = val;
      else if (field === 'booktitle') entry.booktitle = val;
      else if (field === 'publisher') entry.publisher = val;
      else if (field === 'volume') entry.volume = val;
      else if (field === 'number') entry.number = val;
      else if (field === 'pages') entry.pages = val;
      else if (field === 'doi') entry.doi = val;
      else if (field === 'url') entry.url = val;
      else if (field === 'abstract') entry.abstract = val;
    }

    if (entry.title || entry.author || entry.citeKey) {
      entries.push(entry);
    }
  }

  return entries;
}

export function bibToRIS(entries: BibEntry[]): string {
  return entries
    .map(e => {
      const lines: string[] = [];
      const risType = e.type === 'book' ? 'BOOK' : e.type === 'inproceedings' ? 'CONF' : 'JOUR';
      lines.push(`TY  - ${risType}`);
      lines.push(`ID  - ${e.citeKey}`);
      if (e.title) lines.push(`TI  - ${e.title}`);
      if (e.author) {
        // split authors by "and"
        e.author.split(/\s+and\s+/i).forEach(a => {
          lines.push(`AU  - ${a.trim()}`);
        });
      }
      if (e.year) lines.push(`PY  - ${e.year}`);
      if (e.journal) lines.push(`JO  - ${e.journal}`);
      if (e.volume) lines.push(`VL  - ${e.volume}`);
      if (e.number) lines.push(`IS  - ${e.number}`);
      if (e.pages) {
        const [sp, ep] = e.pages.split(/[-–—]+/);
        if (sp) lines.push(`SP  - ${sp.trim()}`);
        if (ep) lines.push(`EP  - ${ep.trim()}`);
      }
      if (e.doi) lines.push(`DO  - ${e.doi}`);
      if (e.url) lines.push(`UR  - ${e.url}`);
      if (e.abstract) lines.push(`AB  - ${e.abstract}`);
      lines.push('ER  - ');
      return lines.join('\n');
    })
    .join('\n\n');
}

export function parseRIS(content: string): BibEntry[] {
  const entries: BibEntry[] = [];
  const records = content.split(/ER\s*-\s*(?:\r?\n|$)/);

  for (const rec of records) {
    if (!rec.trim()) continue;
    const lines = rec.split(/\r?\n/);
    const entry: BibEntry = {
      type: 'article',
      citeKey: `ref_${entries.length + 1}`,
      title: '',
      author: '',
      year: '',
    };
    const authors: string[] = [];

    for (const line of lines) {
      const match = /^([A-Z0-9]{2})\s*-\s*(.*)$/.exec(line.trim());
      if (!match) continue;
      const tag = match[1];
      const val = match[2].trim();

      if (tag === 'TY') {
        entry.type = val.toLowerCase() === 'book' ? 'book' : 'article';
      } else if (tag === 'TI' || tag === 'T1') {
        entry.title = val;
      } else if (tag === 'AU' || tag === 'A1') {
        authors.push(val);
      } else if (tag === 'PY' || tag === 'Y1') {
        entry.year = val.substring(0, 4);
      } else if (tag === 'JO' || tag === 'JF' || tag === 'JA') {
        entry.journal = val;
      } else if (tag === 'VL') {
        entry.volume = val;
      } else if (tag === 'IS') {
        entry.number = val;
      } else if (tag === 'SP') {
        entry.pages = val;
      } else if (tag === 'DO') {
        entry.doi = val;
      } else if (tag === 'UR') {
        entry.url = val;
      } else if (tag === 'ID') {
        entry.citeKey = val;
      }
    }

    if (authors.length > 0) {
      entry.author = authors.join(' and ');
    }

    if (entry.title || entry.author) {
      entries.push(entry);
    }
  }

  return entries;
}

export function risToBibTeX(entries: BibEntry[]): string {
  return entries
    .map(e => {
      const type = e.type || 'article';
      const key = e.citeKey || `ref_${Math.random().toString(36).substring(2, 7)}`;
      const fields: string[] = [];
      if (e.title) fields.push(`  title = {${e.title}}`);
      if (e.author) fields.push(`  author = {${e.author}}`);
      if (e.year) fields.push(`  year = {${e.year}}`);
      if (e.journal) fields.push(`  journal = {${e.journal}}`);
      if (e.volume) fields.push(`  volume = {${e.volume}}`);
      if (e.number) fields.push(`  number = {${e.number}}`);
      if (e.pages) fields.push(`  pages = {${e.pages}}`);
      if (e.doi) fields.push(`  doi = {${e.doi}}`);
      if (e.url) fields.push(`  url = {${e.url}}`);

      return `@${type}{${key},\n${fields.join(',\n')}\n}`;
    })
    .join('\n\n');
}

export function bibToCSV(entries: BibEntry[]): string {
  const headers = ['citeKey', 'type', 'title', 'author', 'year', 'journal', 'doi', 'url'];
  const rows = entries.map(e => [
    `"${(e.citeKey || '').replace(/"/g, '""')}"`,
    `"${(e.type || '').replace(/"/g, '""')}"`,
    `"${(e.title || '').replace(/"/g, '""')}"`,
    `"${(e.author || '').replace(/"/g, '""')}"`,
    `"${(e.year || '').replace(/"/g, '""')}"`,
    `"${(e.journal || '').replace(/"/g, '""')}"`,
    `"${(e.doi || '').replace(/"/g, '""')}"`,
    `"${(e.url || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function bibToMarkdown(entries: BibEntry[]): string {
  return entries
    .map((e, idx) => {
      const author = e.author ? `${e.author}. ` : '';
      const year = e.year ? `(${e.year}). ` : '';
      const title = e.title ? `*${e.title}*. ` : '';
      const journal = e.journal ? `${e.journal}. ` : '';
      const doi = e.doi ? `https://doi.org/${e.doi}` : e.url || '';
      return `${idx + 1}. ${author}${year}${title}${journal}${doi}`.trim();
    })
    .join('\n\n');
}
