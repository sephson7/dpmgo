#!/usr/bin/env node
/**
 * Rebuilds the bundled People Mover schedule and shape from the official GTFS feed.
 *
 *   node scripts/build-dpm-schedule.mjs
 *
 * Source: https://hosted-gtfs-feeds.s3.amazonaws.com/DPM/gtfs.zip
 * (Detroit Transportation Corporation, "Detroit People Mover" GTFS).
 *
 * Outputs:
 *   src/data/dpmSchedule.json   - calendar, exceptions and per-station departures
 *   src/data/peopleMoverShape.ts - the qo5n alignment the simulation follows
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const FEED_URL = 'https://hosted-gtfs-feeds.s3.amazonaws.com/DPM/gtfs.zip';
const SHAPE_ID = 'qo5n';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Feed platform stop name to the app station id. */
const STATION_BY_STOP_NAME = {
  'Times Square': 'times-square',
  Michigan: 'michigan',
  'Fort/Cass': 'fort-cass',
  'Huntington Place': 'huntington',
  'Water Square': 'water-square',
  'Financial District': 'financial',
  'Millender Center': 'millender',
  'Renaissance Center': 'renaissance',
  Bricktown: 'bricktown',
  Greektown: 'greektown',
  'Cadillac Center': 'cadillac',
  Broadway: 'broadway',
  'Grand Circus Park': 'grand-circus',
};

async function download() {
  const response = await fetch(FEED_URL);
  if (!response.ok) throw new Error(`Feed download failed (${response.status})`);
  return new Uint8Array(await response.arrayBuffer());
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
    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') field += char;
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
    files.set(name, { method, data: bytes.subarray(dataStart, dataStart + compressedSize) });
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

  const stationByStopId = new Map();
  for (const stop of stopRows) {
    // location_type 0 is the platform a train actually stops at.
    if (stop.location_type !== '0') continue;
    const stationId = STATION_BY_STOP_NAME[stop.stop_name];
    if (stationId) stationByStopId.set(stop.stop_id, stationId);
  }
  const tripService = new Map(tripRows.map((t) => [t.trip_id, t.service_id]));

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

  const departures = {};
  for (const row of stopTimeRows) {
    const serviceId = tripService.get(row.trip_id);
    const stationId = stationByStopId.get(row.stop_id);
    if (!serviceId || !stationId) continue;
    const list = (departures[serviceId] ??= {});
    (list[stationId] ??= []).push(toSeconds(row.departure_time));
  }
  for (const serviceId of Object.keys(departures)) {
    for (const stationId of Object.keys(departures[serviceId])) {
      departures[serviceId][stationId].sort((a, b) => a - b);
    }
  }

  const shape = shapeRows
    .filter((row) => row.shape_id === SHAPE_ID)
    .sort((a, b) => Number(a.shape_pt_sequence) - Number(b.shape_pt_sequence))
    .map((row) => [Number(row.shape_pt_lon), Number(row.shape_pt_lat)]);

  writeFileSync(
    resolve(root, 'src/data/dpmSchedule.json'),
    `${JSON.stringify({ calendar, exceptions, departures })}\n`,
    'utf8',
  );

  const shapeSource = `// Detroit Transportation Corporation public GTFS, shapes.txt, shape_id ${SHAPE_ID}.
// https://hosted-gtfs-feeds.s3.amazonaws.com/DPM/gtfs.zip
// Regenerated by scripts/build-dpm-schedule.mjs - do not edit by hand.
type Coordinate = [number, number];
export const peopleMoverShape: Coordinate[] = [
${shape.map((point) => `  [${point[0].toFixed(6)}, ${point[1].toFixed(6)}],`).join('\n')}
];
`;
  writeFileSync(resolve(root, 'src/data/peopleMoverShape.ts'), shapeSource, 'utf8');

  const services = calendar.length;
  const trips = new Set(stopTimeRows.map((row) => row.trip_id)).size;
  const stations = new Set([...stationByStopId.values()]);
  const latest = calendar.reduce((max, entry) => (entry.end > max ? entry.end : max), '');
  console.log(
    `Wrote src/data/dpmSchedule.json (${services} services, ${trips} trips, ${stations.size} stations, calendar to ${latest})`,
  );
  console.log(`Wrote src/data/peopleMoverShape.ts (${shape.length} points)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
