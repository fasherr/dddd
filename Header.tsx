export interface GeoPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: string;
  name?: string;
  desc?: string;
}

export interface GeoData {
  title: string;
  points: GeoPoint[];
}

export function parseGPX(xmlContent: string): GeoData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'application/xml');
  
  const title = doc.querySelector('metadata > name, trk > name, gpx > name')?.textContent?.trim() || 'Track';
  const points: GeoPoint[] = [];

  // Parse track points
  const trkpts = doc.querySelectorAll('trkpt');
  trkpts.forEach(pt => {
    const lat = parseFloat(pt.getAttribute('lat') || '0');
    const lon = parseFloat(pt.getAttribute('lon') || '0');
    const ele = pt.querySelector('ele') ? parseFloat(pt.querySelector('ele')!.textContent || '0') : undefined;
    const time = pt.querySelector('time')?.textContent?.trim() || undefined;
    const name = pt.querySelector('name')?.textContent?.trim() || undefined;
    if (!isNaN(lat) && !isNaN(lon)) {
      points.push({ lat, lon, ele, time, name });
    }
  });

  // Also parse waypoints if no trackpoints
  if (points.length === 0) {
    const wpts = doc.querySelectorAll('wpt');
    wpts.forEach(pt => {
      const lat = parseFloat(pt.getAttribute('lat') || '0');
      const lon = parseFloat(pt.getAttribute('lon') || '0');
      const ele = pt.querySelector('ele') ? parseFloat(pt.querySelector('ele')!.textContent || '0') : undefined;
      const time = pt.querySelector('time')?.textContent?.trim() || undefined;
      const name = pt.querySelector('name')?.textContent?.trim() || undefined;
      const desc = pt.querySelector('desc')?.textContent?.trim() || undefined;
      if (!isNaN(lat) && !isNaN(lon)) {
        points.push({ lat, lon, ele, time, name, desc });
      }
    });
  }

  return { title, points };
}

export function parseKML(xmlContent: string): GeoData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'application/xml');
  const title = doc.querySelector('Document > name, kml > name, Placemark > name')?.textContent?.trim() || 'KML Track';
  const points: GeoPoint[] = [];

  const coordElements = doc.querySelectorAll('coordinates');
  coordElements.forEach(elem => {
    const raw = elem.textContent?.trim() || '';
    // Format: lon,lat,alt lon,lat,alt or with newlines
    const rawTuples = raw.split(/\s+/).filter(Boolean);
    for (const tuple of rawTuples) {
      const [lonStr, latStr, eleStr] = tuple.split(',');
      const lon = parseFloat(lonStr);
      const lat = parseFloat(latStr);
      const ele = eleStr ? parseFloat(eleStr) : undefined;
      if (!isNaN(lat) && !isNaN(lon)) {
        points.push({ lat, lon, ele });
      }
    }
  });

  return { title, points };
}

export function parseGeoJSON(jsonContent: string): GeoData {
  const data = JSON.parse(jsonContent);
  const points: GeoPoint[] = [];
  const title = data.name || data.title || 'GeoJSON Track';

  function extractCoords(coords: any[]) {
    if (!Array.isArray(coords)) return;
    if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const lon = coords[0];
      const lat = coords[1];
      const ele = typeof coords[2] === 'number' ? coords[2] : undefined;
      points.push({ lat, lon, ele });
    } else {
      coords.forEach(extractCoords);
    }
  }

  if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
    for (const feature of data.features) {
      if (feature.geometry?.coordinates) {
        extractCoords(feature.geometry.coordinates);
      }
    }
  } else if (data.geometry?.coordinates) {
    extractCoords(data.geometry.coordinates);
  } else if (data.coordinates) {
    extractCoords(data.coordinates);
  }

  return { title, points };
}

export function parseTCX(xmlContent: string): GeoData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'application/xml');
  const title = 'TCX Activity';
  const points: GeoPoint[] = [];

  const trackpoints = doc.querySelectorAll('Trackpoint');
  trackpoints.forEach(tp => {
    const latStr = tp.querySelector('LatitudeDegrees')?.textContent;
    const lonStr = tp.querySelector('LongitudeDegrees')?.textContent;
    const eleStr = tp.querySelector('AltitudeMeters')?.textContent;
    const time = tp.querySelector('Time')?.textContent?.trim();

    if (latStr && lonStr) {
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);
      const ele = eleStr ? parseFloat(eleStr) : undefined;
      if (!isNaN(lat) && !isNaN(lon)) {
        points.push({ lat, lon, ele, time });
      }
    }
  });

  return { title, points };
}

// Exporters
export function geoToGPX(data: GeoData): string {
  const trkpts = data.points
    .map(p => {
      let inner = '';
      if (p.ele !== undefined) inner += `\n        <ele>${p.ele.toFixed(2)}</ele>`;
      if (p.time) inner += `\n        <time>${p.time}</time>`;
      if (p.name) inner += `\n        <name>${escapeXml(p.name)}</name>`;
      return `      <trkpt lat="${p.lat.toFixed(7)}" lon="${p.lon.toFixed(7)}">${inner}\n      </trkpt>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Specialized File Converter" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(data.title)}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${escapeXml(data.title)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

export function geoToKML(data: GeoData): string {
  const coordsStr = data.points
    .map(p => `${p.lon.toFixed(7)},${p.lat.toFixed(7)}${p.ele !== undefined ? ',' + p.ele.toFixed(2) : ',0'}`)
    .join('\n            ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(data.title)}</name>
    <Placemark>
      <name>${escapeXml(data.title)}</name>
      <LineString>
        <extrude>1</extrude>
        <tessellate>1</tessellate>
        <altitudeMode>clampToGround</altitudeMode>
        <coordinates>
            ${coordsStr}
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;
}

export function geoToGeoJSON(data: GeoData): string {
  const coordinates = data.points.map(p => {
    return p.ele !== undefined ? [p.lon, p.lat, p.ele] : [p.lon, p.lat];
  });

  const geojson = {
    type: 'FeatureCollection',
    name: data.title,
    features: [
      {
        type: 'Feature',
        properties: {
          name: data.title,
          pointsCount: data.points.length,
        },
        geometry: {
          type: 'LineString',
          coordinates,
        },
      },
    ],
  };

  return JSON.stringify(geojson, null, 2);
}

export function geoToCSV(data: GeoData): string {
  const headers = ['index', 'latitude', 'longitude', 'elevation_m', 'timestamp', 'name'];
  const rows = data.points.map((p, idx) => [
    idx + 1,
    p.lat.toFixed(7),
    p.lon.toFixed(7),
    p.ele !== undefined ? p.ele.toFixed(2) : '',
    p.time || '',
    `"${(p.name || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, c => {
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
