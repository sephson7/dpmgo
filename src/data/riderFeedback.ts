import { peopleMoverStations } from './transit';

export const RIDER_FEEDBACK_SESSION_KEY = 'dpmgo_rider_feedback_prompted';
export type RiderAnswer = 'yes' | 'no' | 'not-sure';
export type RiderFeedbackContext = {
  stationId: string;
  stationName: string;
  predictedMinutes: number;
  predictionAt: string;
};

/** Only a People Mover estimate observed before boarding is eligible. */
export function canOfferRiderFeedback(
  isBoarded: boolean,
  alreadyPrompted: boolean,
  context: RiderFeedbackContext | null,
): boolean {
  return isBoarded && !alreadyPrompted && context !== null &&
    peopleMoverStations.some((station) => station.id === context.stationId) &&
    Number.isFinite(context.predictedMinutes) && context.predictedMinutes >= 0 &&
    Number.isFinite(Date.parse(context.predictionAt));
}