#!/usr/bin/env node
/**
 * Rebuilds the bundled QLINE schedule data from the official GTFS feed.
 *
 *   node scripts/build-qline-schedule.mjs
 *
 * Source: https://data.trilliumtransit.com/gtfs/qline-mi-us/qline-mi-us.zip
 * (published by Trillium Solutions for the RTA operated QLINE).
 *
 * Outputs:
 *   src/data/qlineSchedule.json  - calendar, departures and headways
 *   src/data/qlineShape.ts       - the northbound and southbound street shapes
 *
 * The app falls back to the published operating hours whenever the feed has
 * no service for the requested date, so a stale feed never shows old times.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { writeGenerated } from './format-generated.mjs';

const FEED_URL = 'https://data.trilliumtransit.com/gtfs/qline-mi-us/qline-mi-us.zip';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Feed stop name (direction suffix removed) to the app station id. */
const STATION_BY_STOP_NAME = {
  'Congress St': 'ql-congress',
  'Campus Martius': 'ql-campus-martius',
  'Grand Circus': 'ql-grand-circus',
  'Montcalm St': 'ql-montcalm',
  'Adelaide St': 'ql-adelaide',
  'Sproat St': 'ql-adelaide',
  'Mack Ave': 'ql-mlk',
  'Canfield St': 'ql-canfield',
  'Warren Ave': 'ql-warren',
  'Ferry St': 'ql-ferry',
  'Amsterdam St': 'ql-amsterdam',
  'Baltimore St': 'ql-baltimore',
  'Grand Blvd': 'ql-grand-blvd',
};

const stripDirection = (name) => name.replace(/\s*-\s*(North|South)bound$/i, '').trim();

async function download() {
  const response = await fetch(FEED_URL);
  if (!response.ok) throw new Error(`Feed download failed (${response.status})`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  // Minimal zip reader: the archive is stored with deflate, so use the
  // platform's DecompressionStream rather than pulling in a dependency.
  return bytes;
}

function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.replace(/^\uFEFF/, '').trim());
  return rows
    .slice(1)
    .filter((r) => r.length > 1 || (r[0] ?? '').trim() !== '')
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}

async function unzip(bytes) {
  const files = new Map();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // Walk the central directory.
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) throw new Error('Not a zip archive');
  const entryCount = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  for (let i = 0; i < entryCount; i += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const data = bytes.subarray(dataStart, dataStart + compressedSize);
    files.set(name, { method, data });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  const out = new Map();
  for (const [name, entry] of files) {
    if (entry.method === 0) {
      out.set(name, new TextDecoder().decode(entry.data));
      continue;
    }
    const stream = new Blob([entry.data])
      .stream()
      .pipeThrough(new DecompressionStream('deflate-raw'));
    out.set(name, await new Response(stream).text());
  }
  return out;
}

const toSeconds = (value) => {
  const [h, m, s] = value.split(':').map(Number);
  return h * 3600 + m * 60 + s;
};

const median = (values) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
};

async function main() {
  console.log(`Downloading ${FEED_URL}`);
  const files = await unzip(await download());
  const read = (name) => parseCsv(files.get(name) ?? '');

  const calendarRows = read('calendar.txt');
  const calendarDateRows = read('calendar_dates.txt');
  const stopRows = read('stops.txt');
  const tripRows = read('trips.txt');
  const stopTimeRows = read('stop_times.txt');
  const shapeRows = read('shapes.txt');

  const stopById = new Map(stopRows.map((s) => [s.stop_id, s]));
  const stationByStopId = new Map();
  for (const stop of stopRows) {
    const stationId = STATION_BY_STOP_NAME[stripDirection(stop.stop_name)];
    if (stationId) stationByStopId.set(stop.stop_id, stationId);
  }
  const tripService = new Map(tripRows.map((t) => [t.trip_id, t.service_id]));
  const tripDirection = new Map(tripRows.map((t) => [t.trip_id, Number(t.direction_id ?? 0)]));

  // Calendar -------------------------------------------------------------
  const calendar = calendarRows
    .filter((row) => row.service_id)
    .map((row) => ({
      id: row.service_id,
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        .map((day, index) => (row[day] === '1' ? index : -1))
        .filter((index) => index >= 0),
      start: row.start_date,
      end: row.end_date,
    }));
  const exceptions = calendarDateRows
    .filter((row) => row.service_id && row.date)
    .map((row) => ({ id: row.service_id, date: row.date, type: Number(row.exception_type ?? 1) }));

  // Departures -----------------------------------------------------------
  /** serviceId -> stationId -> [{ seconds, direction }] */
  const departures = {};
  const directions = {};
  const tripStops = new Map();
  for (const row of stopTimeRows) {
    const serviceId = tripService.get(row.trip_id);
    const stationId = stationByStopId.get(row.stop_id);
    if (!serviceId || !stationId) continue;
    const seconds = toSeconds(row.departure_time);
    const direction = tripDirection.get(row.trip_id) ?? 0;
    const list = (departures[serviceId] ??= {});
    (list[stationId] ??= []).push(seconds);
    const dirList = (directions[serviceId] ??= {});
    (dirList[stationId] ??= []).push(direction);
    if (!tripStops.has(row.trip_id)) tripStops.set(row.trip_id, []);
    tripStops.get(row.trip_id).push({
      stationId,
      direction,
      sequence: Number(row.stop_sequence),
      arrival: toSeconds(row.arrival_time),
      departure: seconds,
    });
  }
  for (const serviceId of Object.keys(departures)) {
    for (const stationId of Object.keys(departures[serviceId])) {
      const pairs = departures[serviceId][stationId].map((seconds, index) => [
        seconds,
        directions[serviceId][stationId][index],
      ]);
      pairs.sort((a, b) => a[0] - b[0]);
      departures[serviceId][stationId] = pairs.map((p) => p[0]);
      directions[serviceId][stationId] = pairs.map((p) => p[1]);
    }
  }

  // Headways -------------------------------------------------------------
  // Congress St is a terminus, so its departure list holds both directions.
  // Measuring the gaps on the mixed list would report half the real headway,
  // so the gaps are measured per direction.
  const headwayMinutes = {};
  for (const serviceId of Object.keys(departures)) {
    const congress = departures[serviceId]['ql-congress'] ?? [];
    const congressDirections = directions[serviceId]['ql-congress'] ?? [];
    const perDirection = new Map();
    congress.forEach((seconds, index) => {
      const direction = congressDirections[index] ?? 0;
      const list = perDirection.get(direction) ?? [];
      list.push(seconds);
      perDirection.set(direction, list);
    });
    const gaps = [];
    for (const list of perDirection.values()) {
      for (let i = 1; i < list.length; i += 1) {
        const gap = Math.round(((list[i] - list[i - 1]) / 60) * 10) / 10;
        if (gap > 0) gaps.push(gap);
      }
    }
    if (gaps.length === 0) continue;
    headwayMinutes[serviceId] = {
      min: Math.min(...gaps),
      max: Math.max(...gaps),
      median: median(gaps),
    };
  }

  // Shapes ---------------------------------------------------------------
  const shapes = new Map();
  for (const row of shapeRows) {
    const list = shapes.get(row.shape_id) ?? [];
    list.push({
      sequence: Number(row.shape_pt_sequence),
      lat: Number(row.shape_pt_lat),
      lon: Number(row.shape_pt_lon),
    });
    shapes.set(row.shape_id, list);
  }
  const shapeList = [...shapes.values()].map((list) =>
    list.sort((a, b) => a.sequence - b.sequence).map((p) => [p.lon, p.lat]),
  );
  // The feed has one shape per direction: the northbound shape runs from
  // Congress St up to Grand Blvd, the southbound shape comes back down.
  const northbound =
    shapeList.find((points) => (points[0]?.[1] ?? 0) < 42.34) ?? shapeList[0] ?? [];
  const southbound = shapeList.find((points) => points !== northbound) ?? shapeList[1] ?? [];

  const output = {
    source: FEED_URL,
    generatedAt: new Date().toISOString(),
    calendar,
    exceptions,
    departures,
    directions,
    headwayMinutes,
  };

  writeFileSync(
    resolve(root, 'src/data/qlineSchedule.json'),
    `${JSON.stringify(output, null, 1)}\n`,
    'utf8',
  );

  const shapeSource = `// Generated from the official QLINE GTFS feed. Do not edit by hand.
// Run \`node scripts/build-qline-schedule.mjs\` to refresh.
// Source: ${FEED_URL}
export type Coordinate = [number, number];

export const qlineNorthboundShape: Coordinate[] = ${JSON.stringify(northbound)};

export const qlineSouthboundShape: Coordinate[] = ${JSON.stringify(southbound)};
`;
  await writeGenerated(resolve(root, 'src/data/qlineShape.ts'), shapeSource);

  const services = calendar.length;
  const trips = new Set(stopTimeRows.map((r) => r.trip_id)).size;
  console.log(`Wrote src/data/qlineSchedule.json (${services} services, ${trips} trips)`);
  console.log(
    `Wrote src/data/qlineShape.ts (northbound ${northbound.length} pts, southbound ${southbound.length} pts)`,
  );
  const windows = Object.entries(headwayMinutes);
  for (const [serviceId, headway] of windows.slice(0, 4)) {
    console.log(
      `  ${serviceId}: headway ${headway.min}-${headway.max} min (median ${headway.median})`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
