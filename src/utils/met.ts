import {DEFAULT_STRENGTH_MET, MET_ACTIVITIES} from '../constants/met';
import type {Intensity} from '../types';
import {roundCalories} from './units';

export function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function lookupActivity(name: string) {
  const needle = normalizeName(name);
  return (
    MET_ACTIVITIES.find(activity => {
      if (normalizeName(activity.name) === needle) {
        return true;
      }
      return activity.aliases.some(alias => normalizeName(alias) === needle);
    }) ??
    MET_ACTIVITIES.find(activity => {
      if (needle.includes(normalizeName(activity.name))) {
        return true;
      }
      return activity.aliases.some(alias => needle.includes(normalizeName(alias)));
    })
  );
}

export function resolveMet(params: {
  activityType: string;
  intensity: Intensity;
  suggestedMET?: number | null;
}): number {
  if (params.suggestedMET && params.suggestedMET > 0) {
    return params.suggestedMET;
  }
  const match = lookupActivity(params.activityType);
  if (match) {
    return match.met[params.intensity];
  }
  return DEFAULT_STRENGTH_MET[params.intensity];
}

/**
 * kcal ≈ MET × bodyWeightKg × durationHours
 */
export function estimateCaloriesFromMet(params: {
  met: number;
  bodyWeightKg: number;
  durationMinutes: number;
}): number {
  const hours = params.durationMinutes / 60;
  return roundCalories(params.met * params.bodyWeightKg * hours);
}

export function estimateActivityCalories(params: {
  activityType: string;
  intensity: Intensity;
  durationMinutes: number;
  bodyWeightKg: number;
  suggestedMET?: number | null;
}): {met: number; estimatedCalories: number; canonicalName: string} {
  const match = lookupActivity(params.activityType);
  const met = resolveMet(params);
  return {
    met,
    estimatedCalories: estimateCaloriesFromMet({
      met,
      bodyWeightKg: params.bodyWeightKg,
      durationMinutes: params.durationMinutes,
    }),
    canonicalName: match?.name ?? params.activityType,
  };
}
