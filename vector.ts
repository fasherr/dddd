import JSZip from 'jszip';

export interface FB2Book {
  title: string;
  authors: string[];
  annotation?: string;
  sections: { title?: string; paragraphs: string[] }[];
}

export function parseFB2(xmlContent: string): FB2Book {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'application/xml');

  const title = doc.querySelector('title-info > book-title')?.textContent?.trim() || 'Untitled Book';
  
  const authors: string[] = [];
  const authorNodes = doc.querySelectorAll('title-info > author');
  authorNodes.forEach(auth => {
    const fn = auth.querySelector('first-name')?.textContent?.trim() || '';
    const ln = auth.querySelector('last-name')?.textContent?.trim() || '';
    const mn = auth.querySelector('middle-name')?.textContent?.trim() || '';
    const fullName = [fn, mn, ln].filter(Boolean).join(' ');
    if (fullName) authors.push(fullName);
  });

  const annotation = doc.querySelector('title-info > annotation')?.textContent?.trim();

  const sections: { title?: string; paragraphs: string[] }[] = [];
  const sectionNodes = doc.querySelectorAll('body > section');

  if (sectionNodes.length > 0) {
    sectionNodes.forEach(sec => {
      const secTitle = sec.querySelector(':scope > title')?.textContent?.trim();
      const pNodes = sec.querySelectorAll(':scope > p, :scope > subtitle');
      const paragraphs: string[] = [];
      pNodes.forEach(p => {
        const text = p.textContent?.trim();
        if (text) paragraphs.push(text);
      });
      sections.push({ title: secTitle, paragraphs });
    });
  } else {
    // Fallback if no sections
    const pNodes = doc.querySelectorAll('body p');
    const paragraphs: string[] = [];
    pNodes.forEach(p => {
      const text = p.textContent?.trim();
      if (text) paragraphs.push(text);
    });
    sections.push({ title: title, paragraphs });
  }

  return {
    title,
    authors: authors.length > 0 ? authors : ['Unknown Author'],
    annotation,
    sections,
  };
}

export function fb2ToPlainText(book: FB2Book): string {
  const lines: string[] = [];
  lines.push(`Title: ${book.title}`);
  lines.push(`Author(s): ${book.authors.join(', ')}`);
  lines.push('='.repeat(40));
  lines.push('');

  if (book.annotation) {
    lines.push('ANNOTATION:');
    lines.push(book.annotation);
    lines.push('');
    lines.push('-'.repeat(40));
    lines.push('');
  }

  for (const sec of book.sections) {
    if (sec.title) {
      lines.push('');
      lines.push(sec.title.toUpperCase());
      lines.push('-'.repeat(sec.title.length));
      lines.push('');
    }
    for (const p of sec.paragraphs) {
      lines.push(p);
      lines.push('');
    }
  }

  return lines.join('\n');
}

export function fb2ToMarkdown(book: FB2Book): string {
  const lines: string[] = [];
  lines.push(`# ${book.title}`);
  lines.push(`*By ${book.authors.join(', ')}*`);
  lines.push('');

  if (book.annotation) {
    lines.push('> ' + book.annotation.replace(/\n/g, '\n> '));
    lines.push('');
  }

  for (const sec of book.sections) {
    if (sec.title) {
      lines.push(`\n## ${sec.title}\n`);
    }
    for (const p of sec.paragraphs) {
      lines.push(p);
      lines.push('');
    }
  }

  return lines.join('\n');
}

export function fb2ToHTML(book: FB2Book): string {
  const authorList = book.authors.map(a => escapeHtml(a)).join(', ');
  let bodyHtml = `<h1>${escapeHtml(book.title)}</h1>\n<p class="author"><em>${authorList}</em></p>\n<hr/>`;

  if (book.annotation) {
    bodyHtml += `\n<div class="annotation"><blockquote>${escapeHtml(book.annotation)}</blockquote></div>`;
  }

  for (const sec of book.sections) {
    bodyHtml += '\n<section>';
    if (sec.title) {
      bodyHtml += `\n  <h2>${escapeHtml(sec.title)}</h2>`;
    }
    for (const p of sec.paragraphs) {
      bodyHtml += `\n  <p>${escapeHtml(p)}</p>`;
    }
    bodyHtml += '\n</section>';
  }

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(book.title)}</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.6; max-width: 750px; margin: 40px auto; padding: 0 20px; color: #111; }
    h1 { font-size: 2rem; margin-bottom: 0.2rem; }
    h2 { font-size: 1.5rem; margin-top: 2rem; }
    p { margin: 1em 0; text-align: justify; text-indent: 1.5em; }
    blockquote { border-left: 4px solid #ccc; padding-left: 1rem; color: #555; }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}

export async function fb2ToEPUB(book: FB2Book): Promise<Blob> {
  const zip = new JSZip();

  // 1. mimetype (MUST NOT be compressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  zip.folder('META-INF')?.file(
    'container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  const oebps = zip.folder('OEBPS')!;

  // 3. OEBPS/text.xhtml
  let chaptersHtml = '';
  for (const sec of book.sections) {
    if (sec.title) {
      chaptersHtml += `<h2>${escapeHtml(sec.title)}</h2>\n`;
    }
    for (const p of sec.paragraphs) {
      chaptersHtml += `<p>${escapeHtml(p)}</p>\n`;
    }
  }

  const xhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeHtml(book.title)}</title>
  <style type="text/css">
    body { font-family: serif; margin: 5%; }
    h1 { text-align: center; }
    p { text-indent: 1.5em; margin-bottom: 0.5em; }
  </style>
</head>
<body>
  <h1>${escapeHtml(book.title)}</h1>
  <p style="text-align: center; font-style: italic;">${escapeHtml(book.authors.join(', '))}</p>
  <hr/>
  ${chaptersHtml}
</body>
</html>`;

  oebps.file('text.xhtml', xhtml);

  // 4. OEBPS/content.opf
  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${escapeHtml(book.title)}</dc:title>
    <dc:language>ru</dc:language>
    <dc:creator opf:role="aut">${escapeHtml(book.authors.join(', '))}</dc:creator>
    <dc:identifier id="BookID">urn:uuid:${generateUUID()}</dc:identifier>
  </metadata>
  <manifest>
    <item id="text" href="text.xhtml" media-type="application/xhtml+xml"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="text"/>
  </spine>
</package>`;

  oebps.file('content.opf', opf);

  // 5. OEBPS/toc.ncx
  const ncx = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:12345"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeHtml(book.title)}</text>
  </docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel>
        <text>${escapeHtml(book.title)}</text>
      </navLabel>
      <content src="text.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;

  oebps.file('toc.ncx', ncx);

  return zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
}

// Markdown and BBCode conversions
export function markdownToBBCode(md: string): string {
  let bb = md;
  // bold
  bb = bb.replace(/\*\*(.*?)\*\*/g, '[b]$1[/b]');
  bb = bb.replace(/__(.*?)__/g, '[b]$1[/b]');
  // italics
  bb = bb.replace(/\*(.*?)\*/g, '[i]$1[/i]');
  bb = bb.replace(/_(.*?)_/g, '[i]$1[/i]');
  // strike
  bb = bb.replace(/~~(.*?)~~/g, '[s]$1[/s]');
  // headers
  bb = bb.replace(/^### (.*$)/gim, '[size=4][b]$1[/b][/size]');
  bb = bb.replace(/^## (.*$)/gim, '[size=5][b]$1[/b][/size]');
  bb = bb.replace(/^# (.*$)/gim, '[size=6][b]$1[/b][/size]');
  // links
  bb = bb.replace(/\[(.*?)\]\((.*?)\)/g, '[url=$2]$1[/url]');
  // code blocks
  bb = bb.replace(/```([\s\S]*?)```/g, '[code]$1[/code]');
  bb = bb.replace(/`([^`]+)`/g, '[font=monospace]$1[/font]');
  // quotes
  bb = bb.replace(/^> (.*$)/gim, '[quote]$1[/quote]');
  return bb;
}

export function bbcodeToMarkdown(bb: string): string {
  let md = bb;
  md = md.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '**$1**');
  md = md.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '*$1*');
  md = md.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '_$1_');
  md = md.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, '~~$1~~');
  md = md.replace(/\[url=(.*?)\]([\s\S]*?)\[\/url\]/gi, '[$2]($1)');
  md = md.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, '<$1>');
  md = md.replace(/\[code\]([\s\S]*?)\[\/code\]/gi, '```\n$1\n```');
  md = md.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, '> $1');
  return md;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, m => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#039;';
      default: return m;
    }
  });
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
