/**
 * Extended Geo & GPS Converters
 * NMEA 0183 (.nmea, .log) & Well-Known Text WKT (.wkt) <-> GPX, GeoJSON, CSV, KML
 */

import { GeoPoint, GeoData } from './geo';

/**
 * Parses NMEA 0183 ($GPGGA, $GPRMC) sentences from GPS loggers
 */
export function parseNMEA(content: string): GeoData {
  const points: GeoPoint[] = [];
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line.startsWith('$')) continue;

    const parts = line.split('*')[0].split(',');
    const sentenceType = parts[0].substring(3); // e.g. 'GGA' or 'RMC'

    if (sentenceType === 'GGA') {
      // $GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47
      const rawLat = parts[2];
      const latDir = parts[3];
      const rawLon = parts[4];
      const lonDir = parts[5];
      const ele = parseFloat(parts[9]);

      if (rawLat && rawLon) {
        const lat = convertNmeaCoord(rawLat, latDir);
        const lon = convertNmeaCoord(rawLon, lonDir);
        points.push({
          lat,
          lon,
          ele: isNaN(ele) ? undefined : ele,
        });
      }
    } else if (sentenceType === 'RMC') {
      // $GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A
      const status = parts[2];
      if (status !== 'A') continue; // Data valid flag

      const rawLat = parts[3];
      const latDir = parts[4];
      const rawLon = parts[5];
      const lonDir = parts[6];

      if (rawLat && rawLon) {
        const lat = convertNmeaCoord(rawLat, latDir);
        const lon = convertNmeaCoord(rawLon, lonDir);
        const prev = points[points.length - 1];
        if (!prev || Math.abs(prev.lat - lat) > 0.00001 || Math.abs(prev.lon - lon) > 0.00001) {
          points.push({ lat, lon });
        }
      }
    }
  }

  return {
    title: 'NMEA Track Log',
    points,
  };
}

function convertNmeaCoord(nmeaCoord: string, direction: string): number {
  const dot = nmeaCoord.indexOf('.');
  if (dot === -1) return 0;
  const degrees = parseFloat(nmeaCoord.substring(0, dot - 2));
  const minutes = parseFloat(nmeaCoord.substring(dot - 2));
  let dec = degrees + minutes / 60.0;
  if (direction === 'S' || direction === 'W') {
    dec = -dec;
  }
  return Number(dec.toFixed(6));
}

/**
 * Parses WKT (Well-Known Text) geometry
 */
export function parseWKT(content: string): GeoData {
  const points: GeoPoint[] = [];
  const clean = content.trim();

  const pointMatch = /^POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i.exec(clean);
  if (pointMatch) {
    const lon = parseFloat(pointMatch[1]);
    const lat = parseFloat(pointMatch[2]);
    points.push({ lat, lon });
    return { title: 'WKT Point', points };
  }

  const lineMatch = /^LINESTRING\s*\(([^)]+)\)/i.exec(clean);
  if (lineMatch) {
    const coordPairs = lineMatch[1].split(',');
    for (const pair of coordPairs) {
      const parts = pair.trim().split(/\s+/);
      if (parts.length >= 2) {
        const lon = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        const ele = parts[2] ? parseFloat(parts[2]) : undefined;
        points.push({ lat, lon, ele });
      }
    }
    return { title: 'WKT LineString', points };
  }

  // Polygon or multiline
  const anyCoordMatch = /([-\d.]+)\s+([-\d.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = anyCoordMatch.exec(clean)) !== null) {
    const lon = parseFloat(m[1]);
    const lat = parseFloat(m[2]);
    if (!isNaN(lon) && !isNaN(lat) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      points.push({ lat, lon });
    }
  }

  return {
    title: 'WKT Geometry',
    points,
  };
}

export function geoToWKT(data: GeoData): string {
  if (data.points.length === 1) {
    return `POINT(${data.points[0].lon} ${data.points[0].lat})`;
  }
  const pairs = data.points.map(p => `${p.lon} ${p.lat}`).join(', ');
  return `LINESTRING(${pairs})`;
}
