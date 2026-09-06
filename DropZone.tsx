// Client-side lightweight parsers and formatters for structured formats:
// JSON, CSV, TSV, YAML, XML, HTML Tables, Markdown Tables, SQL Inserts, Base64, M3U/M3U8 URLs

// ---------------------------------------------------------------------------
// CSV & TSV Handling
// ---------------------------------------------------------------------------

export function parseDelimited(text: string, delimiter = ','): string[][] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];

  return lines.map(line => {
    const values: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    values.push(cur.trim());
    return values;
  });
}

export function jsonToCSV(jsonData: any, delimiter = ','): string {
  const arr = Array.isArray(jsonData) ? jsonData : [jsonData];
  if (arr.length === 0) return '';

  const headers = Array.from(
    new Set(
      arr.flatMap(item => (typeof item === 'object' && item !== null ? Object.keys(item) : ['value']))
    )
  );

  const rows = arr.map(item => {
    return headers.map(h => {
      let val = typeof item === 'object' && item !== null ? item[h] : item;
      if (val === undefined || val === null) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      const strVal = String(val);
      if (strVal.includes(delimiter) || strVal.includes('"') || strVal.includes('\n')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    }).join(delimiter);
  });

  return [headers.join(delimiter), ...rows].join('\n');
}

export function csvToJSON(csvText: string, delimiter = ','): any[] {
  const rows = parseDelimited(csvText, delimiter);
  if (rows.length === 0) return [];

  const headers = rows[0].map(h => h.replace(/^["']|["']$/g, ''));
  const result: any[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    const obj: Record<string, any> = {};
    headers.forEach((h, idx) => {
      let val = values[idx] !== undefined ? values[idx].replace(/^["']|["']$/g, '') : '';
      if (val === 'true') obj[h] = true;
      else if (val === 'false') obj[h] = false;
      else if (!isNaN(Number(val)) && val.trim() !== '') obj[h] = Number(val);
      else obj[h] = val;
    });
    result.push(obj);
  }

  return result;
}

export function tsvToCSV(tsvText: string): string {
  const rows = parseDelimited(tsvText, '\t');
  return rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}

export function csvToTSV(csvText: string): string {
  const rows = parseDelimited(csvText, ',');
  return rows.map(r => r.map(c => c.replace(/[\t\r\n]+/g, ' ')).join('\t')).join('\n');
}

export function csvToMarkdownTable(csvText: string, delimiter = ','): string {
  const rows = parseDelimited(csvText, delimiter);
  if (rows.length === 0) return '';
  const header = rows[0];
  const divider = header.map(() => '---');

  const formattedRows = [
    `| ${header.join(' | ')} |`,
    `| ${divider.join(' | ')} |`,
    ...rows.slice(1).map(r => `| ${r.join(' | ')} |`),
  ];

  return formattedRows.join('\n');
}

// ---------------------------------------------------------------------------
// SQL INSERT Generation
// ---------------------------------------------------------------------------

export function jsonToSQLInsert(jsonData: any, tableName = 'records'): string {
  const arr = Array.isArray(jsonData) ? jsonData : [jsonData];
  if (arr.length === 0) return `-- No records found to generate SQL`;

  const headers = Array.from(
    new Set(
      arr.flatMap(item => (typeof item === 'object' && item !== null ? Object.keys(item) : ['value']))
    )
  );

  const cleanHeaders = headers.map(h => `\`${h.replace(/[^a-zA-Z0-9_]/g, '_')}\``);
  const statements: string[] = [
    `-- Generated SQL INSERT statements`,
    `-- Table: ${tableName}`,
    ``,
  ];

  for (const item of arr) {
    const values = headers.map(h => {
      const val = typeof item === 'object' && item !== null ? item[h] : item;
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return String(val);
      if (typeof val === 'boolean') return val ? '1' : '0';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `'${str.replace(/'/g, "''")}'`;
    });
    statements.push(`INSERT INTO \`${tableName}\` (${cleanHeaders.join(', ')}) VALUES (${values.join(', ')});`);
  }

  return statements.join('\n');
}

// ---------------------------------------------------------------------------
// HTML Tables Parser (HTML -> CSV, JSON, Markdown)
// ---------------------------------------------------------------------------

export function htmlTableToRows(htmlText: string): string[][] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return [];

  const trs = Array.from(table.querySelectorAll('tr'));
  const rows: string[][] = [];

  trs.forEach(tr => {
    const cells = Array.from(tr.querySelectorAll('th, td'));
    if (cells.length > 0) {
      rows.push(cells.map(c => c.textContent?.trim().replace(/\s+/g, ' ') || ''));
    }
  });

  return rows;
}

export function htmlTableToCSV(htmlText: string): string {
  const rows = htmlTableToRows(htmlText);
  return rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}

export function htmlTableToJSON(htmlText: string): any[] {
  const rows = htmlTableToRows(htmlText);
  if (rows.length < 2) return [];
  const headers = rows[0];
  const items: any[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj: Record<string, any> = {};
    headers.forEach((h, idx) => {
      obj[h || `col_${idx + 1}`] = row[idx] || '';
    });
    items.push(obj);
  }

  return items;
}

export function htmlTableToMarkdown(htmlText: string): string {
  const rows = htmlTableToRows(htmlText);
  if (rows.length === 0) return '';
  const header = rows[0];
  const divider = header.map(() => '---');

  const formattedRows = [
    `| ${header.join(' | ')} |`,
    `| ${divider.join(' | ')} |`,
    ...rows.slice(1).map(r => `| ${r.join(' | ')} |`),
  ];

  return formattedRows.join('\n');
}

// ---------------------------------------------------------------------------
// Markdown Parsers (Markdown -> HTML, Plain Text, CSV Table)
// ---------------------------------------------------------------------------

export function markdownToHTML(mdText: string): string {
  // Client-side markdown to clean semantic HTML
  let html = mdText
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/!\[(.*?)\]\((.*?)\)/gim, "<img alt='$1' src='$2' />")
    .replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2' target='_blank'>$1</a>")
    .replace(/\n\s*\n/gim, '</p><p>')
    .replace(/\n/gim, '<br />');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Converted Document</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 760px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1e293b; }
    h1, h2, h3 { margin-top: 1.5em; margin-bottom: 0.5em; color: #0f172a; }
    blockquote { border-left: 4px solid #6366f1; padding-left: 14px; color: #475569; margin: 16px 0; }
    pre, code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
  </style>
</head>
<body>
  <p>${html}</p>
</body>
</html>`;
}

export function markdownToPlainText(mdText: string): string {
  return mdText
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/gs, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .trim();
}

export function markdownTableToCSV(mdText: string): string {
  const lines = mdText.split('\n').filter(l => l.trim().startsWith('|'));
  if (lines.length === 0) return '';

  const rows = lines
    .filter(l => !l.includes('---'))
    .map(line => {
      const parts = line.split('|').slice(1, -1).map(s => s.trim());
      return parts.map(p => `"${p.replace(/"/g, '""')}"`).join(',');
    });

  return rows.join('\n');
}

// ---------------------------------------------------------------------------
// Base64 Handlers
// ---------------------------------------------------------------------------

export function base64ToPlainText(b64Text: string): string {
  const clean = b64Text.trim().replace(/^data:.*?;base64,/, '').replace(/\s+/g, '');
  try {
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoder = new TextDecoder('utf-8', { fatal: false });
    return decoder.decode(bytes);
  } catch (e: any) {
    throw new Error(`Недопустимый формат Base64: ${e.message}`);
  }
}

export function base64ToBinaryBlob(b64Text: string, mimeType = 'application/octet-stream'): Blob {
  const clean = b64Text.trim().replace(/^data:(.*?);base64,/, '');
  const detectedMime = b64Text.match(/^data:(.*?);base64,/)?.[1] || mimeType;

  const binary = atob(clean.replace(/\s+/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: detectedMime });
}

// ---------------------------------------------------------------------------
// M3U / M3U8 -> Clean URLs TXT, CSV, JSON
// ---------------------------------------------------------------------------

export function m3uToCleanURLsTXT(m3uContent: string): string {
  const lines = m3uContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const urls: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    urls.push(line);
  }

  return urls.join('\n');
}

export function m3uToCSV(m3uContent: string): string {
  const lines = m3uContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const headers = ['Track_Title', 'Duration_Sec', 'Stream_URL'];
  const rows: string[][] = [];

  let currentTitle = '';
  let currentDur = '';

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const info = line.replace('#EXTINF:', '');
      const commaIdx = info.indexOf(',');
      if (commaIdx !== -1) {
        currentDur = info.substring(0, commaIdx).trim();
        currentTitle = info.substring(commaIdx + 1).trim();
      } else {
        currentTitle = info.trim();
      }
    } else if (!line.startsWith('#')) {
      rows.push([
        `"${currentTitle.replace(/"/g, '""')}"`,
        currentDur || '-1',
        `"${line.replace(/"/g, '""')}"`,
      ]);
      currentTitle = '';
      currentDur = '';
    }
  }

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function m3uToJSON(m3uContent: string): any[] {
  const lines = m3uContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const items: any[] = [];
  let currentTitle = '';
  let currentDur: number | undefined;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const info = line.replace('#EXTINF:', '');
      const commaIdx = info.indexOf(',');
      if (commaIdx !== -1) {
        currentDur = parseInt(info.substring(0, commaIdx).trim(), 10);
        currentTitle = info.substring(commaIdx + 1).trim();
      } else {
        currentTitle = info.trim();
      }
    } else if (!line.startsWith('#')) {
      items.push({
        title: currentTitle || line,
        duration: currentDur,
        url: line,
      });
      currentTitle = '';
      currentDur = undefined;
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// XML & YAML
// ---------------------------------------------------------------------------

export function jsonToXML(obj: any, rootName = 'root'): string {
  function toXml(val: any, name: string, indent = '  '): string {
    if (val === null || val === undefined) {
      return `${indent}<${name}/>\n`;
    }
    if (Array.isArray(val)) {
      return val.map(item => toXml(item, name, indent)).join('');
    }
    if (typeof val === 'object') {
      const keys = Object.keys(val);
      if (keys.length === 0) {
        return `${indent}<${name}/>\n`;
      }
      let inner = '';
      for (const k of keys) {
        inner += toXml(val[k], sanitizeXmlTag(k), indent + '  ');
      }
      return `${indent}<${name}>\n${inner}${indent}</${name}>\n`;
    }
    return `${indent}<${name}>${escapeXml(String(val))}</${name}>\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n${toXml(obj, rootName, '')}`;
}

export function xmlToJSON(xmlText: string): any {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const root = doc.documentElement;

  function parseNode(node: Element): any {
    const children = Array.from(node.children);
    if (children.length === 0) {
      const text = node.textContent?.trim() || '';
      if (text === 'true') return true;
      if (text === 'false') return false;
      if (!isNaN(Number(text)) && text !== '') return Number(text);
      return text;
    }

    const obj: Record<string, any> = {};
    for (const child of children) {
      const tag = child.tagName;
      const parsedChild = parseNode(child);
      if (obj[tag] !== undefined) {
        if (!Array.isArray(obj[tag])) {
          obj[tag] = [obj[tag]];
        }
        obj[tag].push(parsedChild);
      } else {
        obj[tag] = parsedChild;
      }
    }
    return obj;
  }

  return { [root.tagName]: parseNode(root) };
}

export function jsonToYAML(obj: any, indentLevel = 0): string {
  const indent = '  '.repeat(indentLevel);
  if (obj === null || obj === undefined) return 'null\n';
  if (typeof obj === 'boolean' || typeof obj === 'number') return `${obj}\n`;
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#') || obj.startsWith('-')) {
      return JSON.stringify(obj) + '\n';
    }
    return `${obj}\n`;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]\n';
    let res = '\n';
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        const itemYaml = jsonToYAML(item, indentLevel + 1).trim();
        res += `${indent}- ${itemYaml}\n`;
      } else {
        res += `${indent}- ${String(item)}\n`;
      }
    }
    return res;
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}\n';
    let res = indentLevel === 0 ? '' : '\n';
    for (const k of keys) {
      const val = obj[k];
      if (typeof val === 'object' && val !== null) {
        res += `${indent}${k}:${jsonToYAML(val, indentLevel + 1)}`;
      } else {
        res += `${indent}${k}: ${String(val)}\n`;
      }
    }
    return res;
  }

  return `${String(obj)}\n`;
}

export function yamlToJSON(yamlStr: string): any {
  const lines = yamlStr.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const root: any = {};
  const stack: { indent: number; obj: any; key?: string }[] = [{ indent: -1, obj: root }];

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const matchIndent = line.match(/^(\s*)/);
    const indent = matchIndent ? matchIndent[1].length : 0;
    const trimmed = line.trim();

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const current = stack[stack.length - 1].obj;

    if (trimmed.startsWith('- ')) {
      const itemVal = trimmed.substring(2).trim();
      const parentKey = stack[stack.length - 1].key;
      if (parentKey && !Array.isArray(current[parentKey])) {
        current[parentKey] = [];
      }
      const arr = parentKey ? current[parentKey] : current;
      if (itemVal.includes(':')) {
        const [k, ...v] = itemVal.split(':');
        const subObj = { [k.trim()]: parseYamlVal(v.join(':').trim()) };
        arr.push(subObj);
        stack.push({ indent, obj: subObj });
      } else {
        arr.push(parseYamlVal(itemVal));
      }
    } else if (trimmed.includes(':')) {
      const [k, ...vParts] = trimmed.split(':');
      const key = k.trim();
      const valStr = vParts.join(':').trim();

      if (valStr === '') {
        current[key] = {};
        stack.push({ indent, obj: current[key], key });
      } else {
        current[key] = parseYamlVal(valStr);
      }
    }
  }

  return root;
}

function parseYamlVal(val: string): any {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null') return null;
  if (!isNaN(Number(val)) && val !== '') return Number(val);
  return val.replace(/^["']|["']$/g, '');
}

export function iniToJSON(iniStr: string): Record<string, any> {
  const lines = iniStr.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const result: Record<string, any> = {};
  let currentSection = result;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;
    if (line.startsWith('[') && line.endsWith(']')) {
      const sectionName = line.slice(1, -1).trim();
      result[sectionName] = {};
      currentSection = result[sectionName];
    } else if (line.includes('=')) {
      const [key, ...val] = line.split('=');
      currentSection[key.trim()] = val.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }

  return result;
}

export function jsonToEnv(obj: any): string {
  const flat = flattenObject(obj);
  return Object.entries(flat)
    .map(([k, v]) => `${k.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}=${v}`)
    .join('\n');
}

function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      Object.assign(result, flattenObject(v, newKey));
    } else {
      result[newKey] = v;
    }
  }
  return result;
}

export function harToCurlList(harContent: string): string {
  try {
    const har = JSON.parse(harContent);
    const entries = har.log?.entries || [];
    const commands: string[] = [];

    entries.forEach((entry: any, i: number) => {
      const req = entry.request;
      if (!req) return;
      let cmd = `curl -X ${req.method} "${req.url}"`;
      if (Array.isArray(req.headers)) {
        for (const h of req.headers) {
          if (['cookie', 'authorization', 'host', 'content-length'].includes(h.name.toLowerCase())) continue;
          cmd += ` \\\n  -H "${h.name}: ${h.value.replace(/"/g, '\\"')}"`;
        }
      }
      if (req.postData?.text) {
        cmd += ` \\\n  --data '${req.postData.text.replace(/'/g, "'\\''")}'`;
      }
      commands.push(`# Request ${i + 1}: ${req.method} ${req.url}\n${cmd}\n`);
    });

    return commands.join('\n');
  } catch (e: any) {
    return `# Failed to parse HAR: ${e.message}`;
  }
}

export function harToCSV(harContent: string): string {
  try {
    const har = JSON.parse(harContent);
    const entries = har.log?.entries || [];
    const headers = ['URL', 'Method', 'Status', 'Time_ms', 'Size_bytes', 'MimeType'];
    const rows = entries.map((entry: any) => [
      `"${(entry.request?.url || '').replace(/"/g, '""')}"`,
      `"${entry.request?.method || ''}"`,
      entry.response?.status || '',
      entry.time ? Math.round(entry.time) : '',
      entry.response?.bodySize || '',
      `"${entry.response?.content?.mimeType || ''}"`,
    ]);

    return [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
  } catch (e: any) {
    return 'Error parsing HAR file';
  }
}

function sanitizeXmlTag(str: string): string {
  return str.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
