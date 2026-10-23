import { describe, expect, it } from 'vitest';
import { listDrawerOpens, recordDrawerOpen } from './stationStats';

describe('station drawer traffic', () => {
  it('counts opens per station and ranks the busiest first', async () => {
    await recordDrawerOpen('greektown');
    await recordDrawerOpen('greektown');
    await recordDrawerOpen('bricktown');
    const rows = await listDrawerOpens();
    expect(rows[0]).toMatchObject({ stationId: 'greektown', opens: 2 });
    expect(rows.find((r) => r.stationId === 'bricktown')?.opens).toBe(1);
  });
});
