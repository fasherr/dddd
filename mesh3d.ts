import { CategoryInfo, FormatSpec } from '../types';
import { ALL_FORMAT_SPECS } from './allFormatSpecs';
import {
  parseSRT, parseVTT, parseASS, parseSBV, parseLRC,
  cuesToSRT, cuesToVTT, cuesToASS, cuesToSBV, cuesToLRC, cuesToTXT, cuesToJSON,
  SubtitleCue,
} from './subtitles';
import {
  parseSAMI, parseTTML, parseTimedTextXML, parseSpruceSTL, parseSCC,
  parseQuickTimeText, parseAvidDS, parseCheetahCAP, parseSubViewer1,
  parseSubViewer2, parseMicroDVD, parseMPSub, parseRealText,
  cuesToCSV, cuesToTSV, cuesToInteractiveHTML, cuesToMarkdownTable, cuesToAudacityLabels,
} from './subtitlesExtended';
import {
  parseGPX, parseKML, parseGeoJSON, parseTCX,
  geoToGPX, geoToKML, geoToGeoJSON, geoToCSV,
} from './geo';
import { parseNMEA, parseWKT, geoToWKT } from './geoExtended';
import {
  parseOBJ, objToSTL, parseSTL, meshToOBJ, meshToCSV, meshToJSON,
} from './mesh3d';
import {
  parseBibTeX, bibToRIS, bibToCSV, bibToMarkdown,
  parseRIS, risToBibTeX,
} from './scientific';
import {
  parseFB2, fb2ToPlainText, fb2ToMarkdown, fb2ToHTML, fb2ToEPUB,
  markdownToBBCode, bbcodeToMarkdown,
} from './ebook';
import {
  parseCue, cueToLRC, cueToYouTubeChapters, cueToM3U8, cueToJSON,
  parseM3U, parsePLS, playlistToM3U, playlistToPLS,
} from './audioPlaylists';
import {
  parseOPML, opmlToMarkdown, opmlToM3U,
  parseProperties, parseNDJSON, jsonToNDJSON, parseSQLInserts,
} from './syndication';
import {
  parseICS, icsToCSV, icsToMarkdown,
  parseVCF, vcfToCSV, vcfToJSON,
} from './pim';
import {
  jsonToCSV, csvToJSON, csvToMarkdownTable, csvToTSV, tsvToCSV,
  jsonToSQLInsert, htmlTableToCSV, htmlTableToJSON, htmlTableToMarkdown,
  markdownToHTML, markdownToPlainText, markdownTableToCSV,
  base64ToPlainText, base64ToBinaryBlob,
  m3uToCleanURLsTXT, m3uToCSV, m3uToJSON,
  jsonToXML, xmlToJSON,
  jsonToYAML, yamlToJSON,
  iniToJSON, jsonToEnv,
  harToCurlList, harToCSV,
} from './dataConfig';
import {
  svgToPNG, svgToWebP, svgToJPEG, svgToDataURI, svgToReactComponent,
} from './vector';

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'subtitles',
    name: 'Субтитры и таймкоды',
    description: '18 форматов: TTML, DFXP, SAMI, SSA, STL, SCC, QT, Avid, CAP, SBV, LRC, VTT, SRT, SubViewer, MicroDVD, MPSub',
    icon: 'Subtitles',
  },
  {
    id: 'data',
    name: 'Таблицы и данные',
    description: 'CSV, TSV, JSON, YAML, XML, HTML Tables, Base64, SQL, INI, ENV, HAR',
    icon: 'FileCode2',
  },
  {
    id: 'vector',
    name: 'Векторы и графика',
    description: 'SVG в HD PNG, WebP, JPEG, Base64 Data URI, React JSX компоненты',
    icon: 'Sparkles',
  },
  {
    id: 'audio',
    name: 'Аудио и плейлисты',
    description: 'M3U / M3U8, CUE sheet, Winamp PLS, главы YouTube, LRC караоке',
    icon: 'Music',
  },
  {
    id: 'ebooks',
    name: 'Книги и тексты',
    description: 'Markdown (MD), FictionBook FB2 в EPUB/MD/HTML, BBCode форумов',
    icon: 'BookOpen',
  },
  {
    id: 'geo',
    name: 'Геоданные и GPS-треки',
    description: 'GPX, KML, GeoJSON, TCX, сырые NMEA логи, WKT геометрия',
    icon: 'MapPin',
  },
  {
    id: '3d',
    name: '3D Модели и сетки',
    description: 'Wavefront OBJ, Stereolithography STL 3D-печать, облака точек',
    icon: 'Box',
  },
  {
    id: 'scientific',
    name: 'Научные статьи и ссылки',
    description: 'BibTeX статьи LaTeX, RIS библиография Mendeley/Zotero',
    icon: 'GraduationCap',
  },
  {
    id: 'syndication',
    name: 'Ленты, код и дампы',
    description: 'OPML подкасты/RSS, Java Properties, NDJSON, SQL INSERT дампы',
    icon: 'Rss',
  },
  {
    id: 'pim',
    name: 'Календари и контакты',
    description: 'iCalendar ICS встречи, vCard VCF контакты телефонов в Excel CSV/JSON',
    icon: 'Calendar',
  },
];

export const FORMATS: FormatSpec[] = ALL_FORMAT_SPECS;

// Helper to detect format from filename
export function detectFormatByFilename(filename: string): FormatSpec | undefined {
  const lower = filename.toLowerCase();

  // Multi-dot / Compound extensions
  if (lower.endsWith('.qt.txt')) return FORMATS.find(f => f.id === 'qt_txt');
  if (lower.endsWith('.geojson')) return FORMATS.find(f => f.id === 'geojson');
  if (lower.endsWith('.m3u8') || lower.endsWith('.m3u')) return FORMATS.find(f => f.id === 'm3u');
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return FORMATS.find(f => f.id === 'yaml');
  if (lower.endsWith('.ical') || lower.endsWith('.ics')) return FORMATS.find(f => f.id === 'ics');
  if (lower.endsWith('.ssa')) return FORMATS.find(f => f.id === 'ssa');
  if (lower.endsWith('.ass')) return FORMATS.find(f => f.id === 'ass');
  if (lower.endsWith('.sami') || lower.endsWith('.smi')) return FORMATS.find(f => f.id === 'sami');
  if (lower.endsWith('.dfxp')) return FORMATS.find(f => f.id === 'dfxp');
  if (lower.endsWith('.ttml')) return FORMATS.find(f => f.id === 'ttml');
  if (lower.endsWith('.scc')) return FORMATS.find(f => f.id === 'scc');
  if (lower.endsWith('.cap')) return FORMATS.find(f => f.id === 'cheetah_cap');
  if (lower.endsWith('.sbv')) return FORMATS.find(f => f.id === 'sbv');
  if (lower.endsWith('.lrc')) return FORMATS.find(f => f.id === 'lrc');
  if (lower.endsWith('.tsv')) return FORMATS.find(f => f.id === 'tsv');
  if (lower.endsWith('.csv')) return FORMATS.find(f => f.id === 'csv');
  if (lower.endsWith('.json')) return FORMATS.find(f => f.id === 'json');
  if (lower.endsWith('.rt')) return FORMATS.find(f => f.id === 'realtext');
  if (lower.endsWith('.md')) return FORMATS.find(f => f.id === 'md');
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return FORMATS.find(f => f.id === 'html_table');
  if (lower.endsWith('.b64')) return FORMATS.find(f => f.id === 'base64');
  if (lower.endsWith('.svg')) return FORMATS.find(f => f.id === 'svg');
  if (lower.endsWith('.properties')) return FORMATS.find(f => f.id === 'properties');
  if (lower.endsWith('.jsonl') || lower.endsWith('.ndjson')) return FORMATS.find(f => f.id === 'ndjson');
  if (lower.endsWith('.env')) return FORMATS.find(f => f.id === 'env');
  if (lower.endsWith('.cfg') || lower.endsWith('.ini')) return FORMATS.find(f => f.id === 'ini');

  const dotIdx = lower.lastIndexOf('.');
  if (dotIdx === -1) return undefined;
  const ext = lower.substring(dotIdx + 1);

  // Exact ID match or extension match
  return FORMATS.find(f => f.id === ext || f.extension === `.${ext}`);
}

/**
 * Universal Subtitle Formatter: converts any array of SubtitleCue to the target format
 */
function formatSubtitleCues(cues: SubtitleCue[], targetFormatId: string, cleanBase: string): string {
  switch (targetFormatId) {
    case 'srt':
      return cuesToSRT(cues);
    case 'vtt':
      return cuesToVTT(cues);
    case 'ass':
    case 'ssa':
      return cuesToASS(cues, cleanBase);
    case 'sbv':
      return cuesToSBV(cues);
    case 'lrc':
      return cuesToLRC(cues);
    case 'txt':
      return cuesToTXT(cues, false);
    case 'json':
      return cuesToJSON(cues);
    case 'csv':
      return cuesToCSV(cues);
    case 'tsv':
      return cuesToTSV(cues);
    case 'html':
      return cuesToInteractiveHTML(cues, cleanBase);
    case 'md':
      return cuesToMarkdownTable(cues);
    case 'labels':
      return cuesToAudacityLabels(cues);
    default:
      throw new Error(`Неподдерживаемый целевой формат субтитров: ${targetFormatId.toUpperCase()}`);
  }
}

// Master Dispatcher
export async function convertContent(
  sourceContent: string,
  sourceFormatId: string,
  targetFormatId: string,
  baseFilename: string
): Promise<{ result: string | Blob; outputFilename: string }> {
  const cleanBase = baseFilename.replace(/\.[^.]+$/, '');

  // 1. СУБТИТРЫ (18 входных форматов)
  const subtitleSourceIds = [
    'srt', 'vtt', 'ass', 'ssa', 'sbv', 'lrc', 'sami', 'ttml', 'dfxp',
    'spruce_stl', 'scc', 'qt_txt', 'avid_ds', 'cheetah_cap', 'ebu_stl',
    'timedtext_xml', 'subviewer1', 'subviewer2', 'microdvd', 'mpsub', 'realtext',
  ];

  if (subtitleSourceIds.includes(sourceFormatId)) {
    let cues: SubtitleCue[] = [];

    if (sourceFormatId === 'srt') cues = parseSRT(sourceContent);
    else if (sourceFormatId === 'vtt') cues = parseVTT(sourceContent);
    else if (sourceFormatId === 'ass' || sourceFormatId === 'ssa') cues = parseASS(sourceContent);
    else if (sourceFormatId === 'sbv') cues = parseSBV(sourceContent);
    else if (sourceFormatId === 'lrc') cues = parseLRC(sourceContent);
    else if (sourceFormatId === 'sami') cues = parseSAMI(sourceContent);
    else if (sourceFormatId === 'ttml') cues = parseTTML(sourceContent);
    else if (sourceFormatId === 'dfxp') cues = parseTTML(sourceContent);
    else if (sourceFormatId === 'spruce_stl') cues = parseSpruceSTL(sourceContent);
    else if (sourceFormatId === 'scc') cues = parseSCC(sourceContent);
    else if (sourceFormatId === 'qt_txt') cues = parseQuickTimeText(sourceContent);
    else if (sourceFormatId === 'avid_ds') cues = parseAvidDS(sourceContent);
    else if (sourceFormatId === 'cheetah_cap') cues = parseCheetahCAP(sourceContent);
    else if (sourceFormatId === 'ebu_stl') cues = parseSpruceSTL(sourceContent);
    else if (sourceFormatId === 'timedtext_xml') cues = parseTimedTextXML(sourceContent);
    else if (sourceFormatId === 'subviewer1') cues = parseSubViewer1(sourceContent);
    else if (sourceFormatId === 'subviewer2') cues = parseSubViewer2(sourceContent);
    else if (sourceFormatId === 'microdvd') cues = parseMicroDVD(sourceContent);
    else if (sourceFormatId === 'mpsub') cues = parseMPSub(sourceContent);
    else if (sourceFormatId === 'realtext') cues = parseRealText(sourceContent);

    if (cues.length === 0) {
      throw new Error(`Не удалось обнаружить валидные таймкоды или субтитры в файле ${sourceFormatId.toUpperCase()}`);
    }

    const output = formatSubtitleCues(cues, targetFormatId, cleanBase);
    let outExt = targetFormatId;
    if (targetFormatId === 'labels') outExt = 'txt';
    return { result: output, outputFilename: `${cleanBase}.${outExt}` };
  }

  // 2. ДАННЫЕ И ТАБЛИЦЫ (CSV, TSV, JSON, YAML, XML, HTML Tables, Base64)
  if (sourceFormatId === 'csv') {
    if (targetFormatId === 'json') return { result: JSON.stringify(csvToJSON(sourceContent, ','), null, 2), outputFilename: `${cleanBase}.json` };
    if (targetFormatId === 'tsv') return { result: csvToTSV(sourceContent), outputFilename: `${cleanBase}.tsv` };
    if (targetFormatId === 'yaml') return { result: jsonToYAML(csvToJSON(sourceContent, ',')), outputFilename: `${cleanBase}.yaml` };
    if (targetFormatId === 'xml') return { result: jsonToXML(csvToJSON(sourceContent, ',')), outputFilename: `${cleanBase}.xml` };
    if (targetFormatId === 'md') return { result: csvToMarkdownTable(sourceContent), outputFilename: `${cleanBase}.md` };
    if (targetFormatId === 'sql') return { result: jsonToSQLInsert(csvToJSON(sourceContent, ','), cleanBase), outputFilename: `${cleanBase}.sql` };
  }

  if (sourceFormatId === 'tsv') {
    if (targetFormatId === 'csv') return { result: tsvToCSV(sourceContent), outputFilename: `${cleanBase}.csv` };
    if (targetFormatId === 'json') return { result: JSON.stringify(csvToJSON(sourceContent, '\t'), null, 2), outputFilename: `${cleanBase}.json` };
    if (targetFormatId === 'md') return { result: csvToMarkdownTable(sourceContent, '\t'), outputFilename: `${cleanBase}.md` };
    if (targetFormatId === 'yaml') return { result: jsonToYAML(csvToJSON(sourceContent, '\t')), outputFilename: `${cleanBase}.yaml` };
    if (targetFormatId === 'xml') return { result: jsonToXML(csvToJSON(sourceContent, '\t')), outputFilename: `${cleanBase}.xml` };
  }

  if (sourceFormatId === 'json') {
    const parsed = JSON.parse(sourceContent);
    if (targetFormatId === 'csv') return { result: jsonToCSV(parsed), outputFilename: `${cleanBase}.csv` };
    if (targetFormatId === 'tsv') return { result: csvToTSV(jsonToCSV(parsed)), outputFilename: `${cleanBase}.tsv` };
    if (targetFormatId === 'yaml') return { result: jsonToYAML(parsed), outputFilename: `${cleanBase}.yaml` };
    if (targetFormatId === 'xml') return { result: jsonToXML(parsed), outputFilename: `${cleanBase}.xml` };
    if (targetFormatId === 'md') return { result: csvToMarkdownTable(jsonToCSV(parsed)), outputFilename: `${cleanBase}.md` };
    if (targetFormatId === 'env') return { result: jsonToEnv(parsed), outputFilename: `${cleanBase}.env` };
    if (targetFormatId === 'ndjson') return { result: jsonToNDJSON(parsed), outputFilename: `${cleanBase}.ndjson` };
    if (targetFormatId === 'sql') return { result: jsonToSQLInsert(parsed, cleanBase), outputFilename: `${cleanBase}.sql` };
  }

  if (sourceFormatId === 'yaml') {
    const parsed = yamlToJSON(sourceContent);
    if (targetFormatId === 'json') return { result: JSON.stringify(parsed, null, 2), outputFilename: `${cleanBase}.json` };
    if (targetFormatId === 'xml') return { result: jsonToXML(parsed), outputFilename: `${cleanBase}.xml` };
    if (targetFormatId === 'csv') return { result: jsonToCSV(parsed), outputFilename: `${cleanBase}.csv` };
  }

  if (sourceFormatId === 'xml') {
    const parsed = xmlToJSON(sourceContent);
    if (targetFormatId === 'json') return { result: JSON.stringify(parsed, null, 2), outputFilename: `${cleanBase}.json` };
    if (targetFormatId === 'yaml') return { result: jsonToYAML(parsed), outputFilename: `${cleanBase}.yaml` };
    if (targetFormatId === 'csv') return { result: jsonToCSV(parsed), outputFilename: `${cleanBase}.csv` };
  }

  if (sourceFormatId === 'html_table') {
    if (targetFormatId === 'csv') return { result: htmlTableToCSV(sourceContent), outputFilename: `${cleanBase}.csv` };
    if (targetFormatId === 'json') return { result: JSON.stringify(htmlTableToJSON(sourceContent), null, 2), outputFilename: `${cleanBase}.json` };
    if (targetFormatId === 'md') return { result: htmlTableToMarkdown(sourceContent), outputFilename: `${cleanBase}.md` };
  }

  if (sourceFormatId === 'base64') {
    if (targetFormatId === 'txt') return { result: base64ToPlainText(sourceContent), outputFilename: `${cleanBase}_decoded.txt` };
    if (targetFormatId === 'bin') return { result: base64ToBinaryBlob(sourceContent, 'application/octet-stream'), outputFilename: `${cleanBase}.bin` };
    if (targetFormatId === 'img') return { result: base64ToBinaryBlob(sourceContent, 'image/png'), outputFilename: `${cleanBase}.png` };
  }

  // 3. ТЕКСТ И MARKDOWN
  if (sourceFormatId === 'md') {
    if (targetFormatId === 'html') return { result: markdownToHTML(sourceContent), outputFilename: `${cleanBase}.html` };
    if (targetFormatId === 'txt') return { result: markdownToPlainText(sourceContent), outputFilename: `${cleanBase}.txt` };
    if (targetFormatId === 'csv') return { result: markdownTableToCSV(sourceContent), outputFilename: `${cleanBase}.csv` };
    if (targetFormatId === 'bbcode') return { result: markdownToBBCode(sourceContent), outputFilename: `${cleanBase}.bbcode` };
  }

  // 4. ВЕКТОРНАЯ ГРАФИКА (SVG -> PNG, WebP, JPEG, DataURI, JSX)
  if (sourceFormatId === 'svg') {
    if (targetFormatId === 'png') {
      const pngBlob = await svgToPNG(sourceContent, 2);
      return { result: pngBlob, outputFilename: `${cleanBase}.png` };
    }
    if (targetFormatId === 'webp') {
      const webpBlob = await svgToWebP(sourceContent, 2);
      return { result: webpBlob, outputFilename: `${cleanBase}.webp` };
    }
    if (targetFormatId === 'jpeg') {
      const jpegBlob = await svgToJPEG(sourceContent, 2);
      return { result: jpegBlob, outputFilename: `${cleanBase}.jpg` };
    }
    if (targetFormatId === 'datauri') {
      return { result: svgToDataURI(sourceContent), outputFilename: `${cleanBase}_datauri.txt` };
    }
    if (targetFormatId === 'jsx') {
      return { result: svgToReactComponent(sourceContent, cleanBase.replace(/[^a-zA-Z0-9]/g, '') || 'Icon'), outputFilename: `${cleanBase}.tsx` };
    }
  }

  // 5. ПЛЕЙЛИСТЫ И АУДИО (M3U / M3U8, CUE, PLS)
  if (sourceFormatId === 'm3u') {
    if (targetFormatId === 'txt') return { result: m3uToCleanURLsTXT(sourceContent), outputFilename: `${cleanBase}_urls.txt` };
    if (targetFormatId === 'csv') return { result: m3uToCSV(sourceContent), outputFilename: `${cleanBase}.csv` };
    if (targetFormatId === 'json') return { result: JSON.stringify(m3uToJSON(sourceContent), null, 2), outputFilename: `${cleanBase}.json` };
    if (targetFormatId === 'pls') return { result: playlistToPLS(parseM3U(sourceContent)), outputFilename: `${cleanBase}.pls` };
  }

  if (sourceFormatId === 'cue') {
    const sheet = parseCue(sourceContent);
    if (targetFormatId === 'lrc') return { result: cueToLRC(sheet), outputFilename: `${cleanBase}.lrc` };
    if (targetFormatId === 'm3u8') return { result: cueToM3U8(sheet), outputFilename: `${cleanBase}.m3u8` };
    if (targetFormatId === 'txt') return { result: cueToYouTubeChapters(sheet), outputFilename: `${cleanBase}_chapters.txt` };
    if (targetFormatId === 'json') return { result: cueToJSON(sheet), outputFilename: `${cleanBase}.json` };
  }

  if (sourceFormatId === 'pls') {
    const items = parsePLS(sourceContent);
    if (targetFormatId === 'm3u8') return { result: playlistToM3U(items), outputFilename: `${cleanBase}.m3u8` };
    if (targetFormatId === 'json') return { result: JSON.stringify(items, null, 2), outputFilename: `${cleanBase}.json` };
    if (targetFormatId === 'txt') return { result: items.map(i => `${i.title} -> ${i.uri}`).join('\n'), outputFilename: `${cleanBase}.txt` };
  }

  // 6. ГЕОДАННЫЕ (GPX, KML, GeoJSON, TCX, NMEA, WKT)
  if (['gpx', 'kml', 'geojson', 'tcx', 'nmea', 'wkt'].includes(sourceFormatId)) {
    let data: any;
    if (sourceFormatId === 'gpx') data = parseGPX(sourceContent);
    else if (sourceFormatId === 'kml') data = parseKML(sourceContent);
    else if (sourceFormatId === 'geojson') data = parseGeoJSON(sourceContent);
    else if (sourceFormatId === 'tcx') data = parseTCX(sourceContent);
    else if (sourceFormatId === 'nmea') data = parseNMEA(sourceContent);
    else if (sourceFormatId === 'wkt') data = parseWKT(sourceContent);

    if (!data || !data.points || data.points.length === 0) {
      throw new Error(`В файле ${sourceFormatId.toUpperCase()} не найдено географических координат`);
    }

    let output = '';
    if (targetFormatId === 'gpx') output = geoToGPX(data);
    else if (targetFormatId === 'kml') output = geoToKML(data);
    else if (targetFormatId === 'geojson') output = geoToGeoJSON(data);
    else if (targetFormatId === 'csv') output = geoToCSV(data);
    else if (targetFormatId === 'wkt') output = geoToWKT(data);
    else throw new Error(`Неподдерживаемый целевой геоформат: ${targetFormatId}`);

    return { result: output, outputFilename: `${cleanBase}.${targetFormatId}` };
  }

  // 7. 3D МОДЕЛИ (OBJ, STL)
  if (sourceFormatId === 'obj') {
    const mesh = parseOBJ(sourceContent);
    if (targetFormatId === 'stl') return { result: objToSTL(mesh, cleanBase), outputFilename: `${cleanBase}.stl` };
    if (targetFormatId === 'csv') return { result: meshToCSV(mesh), outputFilename: `${cleanBase}_vertices.csv` };
    if (targetFormatId === 'json') return { result: meshToJSON(mesh), outputFilename: `${cleanBase}.json` };
  }

  if (sourceFormatId === 'stl') {
    const mesh = parseSTL(sourceContent);
    if (targetFormatId === 'obj') return { result: meshToOBJ(mesh), outputFilename: `${cleanBase}.obj` };
    if (targetFormatId === 'csv') return { result: meshToCSV(mesh), outputFilename: `${cleanBase}_vertices.csv` };
    if (targetFormatId === 'json') return { result: meshToJSON(mesh), outputFilename: `${cleanBase}.json` };
  }

  // 8. НАУЧНЫЕ СТАТЬИ (BibTeX, RIS)
  if (sourceFormatId === 'bib') {
    const entries = parseBibTeX(sourceContent);
    if (entries.length === 0) throw new Error('В файле BibTeX не найдено записей @article/@book');
    if (targetFormatId === 'ris') return { result: bibToRIS(entries), outputFilename: `${cleanBase}.ris` };
    if (targetFormatId === 'csv') return { result: bibToCSV(entries), outputFilename: `${cleanBase}.csv` };
    if (targetFormatId === 'md') return { result: bibToMarkdown(entries), outputFilename: `${cleanBase}.md` };
    if (targetFormatId === 'json') return { result: JSON.stringify(entries, null, 2), outputFilename: `${cleanBase}.json` };
  }

  if (sourceFormatId === 'ris') {
    const entries = parseRIS(sourceContent);
    if (entries.length === 0) throw new Error('В файле RIS не найдено записей TY - ...');
    if (targetFormatId === 'bib') return { result: risToBibTeX(entries), outputFilename: `${cleanBase}.bib` };
    if (targetFormatId === 'csv') return { result: bibToCSV(entries), outputFilename: `${cleanBase}.csv` };
    if (targetFormatId === 'txt') return { result: bibToMarkdown(entries), outputFilename: `${cleanBase}.txt` };
    if (targetFormatId === 'json') return { result: JSON.stringify(entries, null, 2), outputFilename: `${cleanBase}.json` };
  }

  // 9. ЭЛЕКТРОННЫЕ КНИГИ (FB2, BBCode)
  if (sourceFormatId === 'fb2') {
    const book = parseFB2(sourceContent);
    if (targetFormatId === 'txt') return { result: fb2ToPlainText(book), outputFilename: `${cleanBase}.txt` };
    if (targetFormatId === 'md') return { result: fb2ToMarkdown(book), outputFilename: `${cleanBase}.md` };
    if (targetFormatId === 'html') return { result: fb2ToHTML(book), outputFilename: `${cleanBase}.html` };
    if (targetFormatId === 'epub') {
      const epubBlob = await fb2ToEPUB(book);
      return { result: epubBlob, outputFilename: `${cleanBase}.epub` };
    }
  }

  if (sourceFormatId === 'bbcode' && targetFormatId === 'md') {
    return { result: bbcodeToMarkdown(sourceContent), outputFilename: `${cleanBase}.md` };
  }
  if (sourceFormatId === 'bbcode' && targetFormatId === 'html') {
    const md = bbcodeToMarkdown(sourceContent);
    return { result: `<div class="formatted-text">${md.replace(/\n/g, '<br/>')}</div>`, outputFilename: `${cleanBase}.html` };
  }

  // 10. СИНДИКАЦИЯ И ДАМПЫ (OPML, Properties, NDJSON, SQL)
  if (sourceFormatId === 'opml') {
    const parsed = parseOPML(sourceContent);
    if (targetFormatId === 'md') return { result: opmlToMarkdown(parsed), outputFilename: `${cleanBase}.md` };
    if (targetFormatId === 'm3u') return { result: opmlToM3U(parsed), outputFilename: `${cleanBase}.m3u` };
    if (targetFormatId === 'json') return { result: JSON.stringify(parsed, null, 2), outputFilename: `${cleanBase}.json` };
    if (targetFormatId === 'html') return { result: `<!DOCTYPE html><html><body>\n${opmlToMarkdown(parsed).replace(/\n/g, '<br/>')}\n</body></html>`, outputFilename: `${cleanBase}.html` };
  }

  if (sourceFormatId === 'properties') {
    const obj = parseProperties(sourceContent);
    if (targetFormatId === 'json') return { result: JSON.stringify(obj, null, 2), outputFilename: `${cleanBase}.json` };
    if (targetFormatId === 'yaml') return { result: jsonToYAML(obj), outputFilename: `${cleanBase}.yaml` };
    if (targetFormatId === 'env') return { result: jsonToEnv(obj), outputFilename: `${cleanBase}.env` };
  }

  if (sourceFormatId === 'ndjson') {
    const arr = parseNDJSON(sourceContent);
    if (targetFormatId === 'json') return { result: JSON.stringify(arr, null, 2), outputFilename: `${cleanBase}.json` };
    if (targetFormatId === 'csv') return { result: jsonToCSV(arr), outputFilename: `${cleanBase}.csv` };
    if (targetFormatId === 'yaml') return { result: jsonToYAML(arr), outputFilename: `${cleanBase}.yaml` };
  }

  if (sourceFormatId === 'sql') {
    const rows = parseSQLInserts(sourceContent);
    if (rows.length === 0) throw new Error('Не найдено выражений INSERT INTO ... VALUES');
    if (targetFormatId === 'json') return { result: JSON.stringify(rows, null, 2), outputFilename: `${cleanBase}.json` };
    if (targetFormatId === 'csv') return { result: jsonToCSV(rows), outputFilename: `${cleanBase}.csv` };
    if (targetFormatId === 'yaml') return { result: jsonToYAML(rows), outputFilename: `${cleanBase}.yaml` };
  }

  // 11. КАЛЕНДАРИ И КОНТАКТЫ (ICS, VCF)
  if (sourceFormatId === 'ics') {
    const events = parseICS(sourceContent);
    if (targetFormatId === 'csv') return { result: icsToCSV(events), outputFilename: `${cleanBase}.csv` };
    if (targetFormatId === 'json') return { result: JSON.stringify(events, null, 2), outputFilename: `${cleanBase}.json` };
    if (targetFormatId === 'md') return { result: icsToMarkdown(events), outputFilename: `${cleanBase}.md` };
  }

  if (sourceFormatId === 'vcf') {
    const contacts = parseVCF(sourceContent);
    if (targetFormatId === 'csv') return { result: vcfToCSV(contacts), outputFilename: `${cleanBase}.csv` };
    if (targetFormatId === 'json') return { result: vcfToJSON(contacts), outputFilename: `${cleanBase}.json` };
  }

  // 12. СЕТЕВЫЕ АРХИВЫ (HAR) И ДРУГИЕ
  if (sourceFormatId === 'har') {
    if (targetFormatId === 'curl') return { result: harToCurlList(sourceContent), outputFilename: `${cleanBase}_curls.sh` };
    if (targetFormatId === 'csv') return { result: harToCSV(sourceContent), outputFilename: `${cleanBase}.csv` };
    if (targetFormatId === 'json') return { result: sourceContent, outputFilename: `${cleanBase}.json` };
  }

  if (sourceFormatId === 'ini' || sourceFormatId === 'env') {
    const parsed = iniToJSON(sourceContent);
    if (targetFormatId === 'json') return { result: JSON.stringify(parsed, null, 2), outputFilename: `${cleanBase}.json` };
    if (targetFormatId === 'yaml') return { result: jsonToYAML(parsed), outputFilename: `${cleanBase}.yaml` };
    if (targetFormatId === 'env') return { result: jsonToEnv(parsed), outputFilename: `${cleanBase}.env` };
  }

  throw new Error(`Преобразование из ${sourceFormatId.toUpperCase()} в ${targetFormatId.toUpperCase()} пока не поддерживается`);
}
