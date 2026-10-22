import { describe, expect, it } from 'vitest';
import { canOfferRiderFeedback, type RiderFeedbackContext } from './riderFeedback';

const context: RiderFeedbackContext = { stationId: 'bricktown', stationName: 'Bricktown', predictedMinutes: 9, predictionAt: '2026-10-22T17:18:00Z' };
describe('rider feedback eligibility', () => {
  it('only offers feedback after Boarded', () => {
    expect(canOfferRiderFeedback(false, false, context)).toBe(false);
    expect(canOfferRiderFeedback(true, false, context)).toBe(true);
  });
  it('does not offer it again in the same session', () => {
    expect(canOfferRiderFeedback(true, true, context)).toBe(false);
  });
  it('never asks about a QLINE or unknown station', () => {
    expect(canOfferRiderFeedback(true, false, { ...context, stationId: 'qline-congress' })).toBe(false);
    expect(canOfferRiderFeedback(true, false, { ...context, stationId: 'unknown' })).toBe(false);
  });
  it('requires a captured valid prediction', () => {
    expect(canOfferRiderFeedback(true, false, null)).toBe(false);
    expect(canOfferRiderFeedback(true, false, { ...context, predictedMinutes: NaN })).toBe(false);
    expect(canOfferRiderFeedback(true, false, { ...context, predictionAt: 'invalid' })).toBe(false);
  });
});