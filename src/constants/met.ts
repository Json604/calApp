import type {Intensity} from '../types';

export interface MetActivity {
  name: string;
  aliases: string[];
  met: Record<Intensity, number>;
}

/**
 * MET values are typical Compendium of Physical Activities approximations.
 * Calorie math stays local: kcal ≈ MET × bodyWeightKg × hours.
 */
export const MET_ACTIVITIES: MetActivity[] = [
  {
    name: 'Walking',
    aliases: ['walk', 'walked', 'hike', 'hiking'],
    met: {light: 2.8, moderate: 3.5, vigorous: 5.0},
  },
  {
    name: 'Running',
    aliases: ['run', 'ran', 'jog', 'jogging'],
    met: {light: 6.0, moderate: 8.3, vigorous: 11.0},
  },
  {
    name: 'Cycling',
    aliases: ['bike', 'biking', 'cycle', 'cycled'],
    met: {light: 4.0, moderate: 6.8, vigorous: 10.0},
  },
  {
    name: 'Basketball',
    aliases: ['played basketball'],
    met: {light: 4.5, moderate: 6.5, vigorous: 8.0},
  },
  {
    name: 'Swimming',
    aliases: ['swim', 'swam'],
    met: {light: 5.0, moderate: 7.0, vigorous: 9.5},
  },
  {
    name: 'Elliptical',
    aliases: ['elliptical machine'],
    met: {light: 4.0, moderate: 5.0, vigorous: 7.0},
  },
  {
    name: 'Stair machine',
    aliases: ['stairs', 'stairmaster', 'stair climber'],
    met: {light: 5.0, moderate: 9.0, vigorous: 12.0},
  },
  {
    name: 'Rowing',
    aliases: ['rower', 'rowed', 'row'],
    met: {light: 3.5, moderate: 7.0, vigorous: 12.0},
  },
  {
    name: 'Strength training',
    aliases: [
      'weights',
      'lifting',
      'resistance training',
      'gym',
      'weightlifting',
      'workout',
    ],
    met: {light: 3.5, moderate: 5.0, vigorous: 6.0},
  },
  {
    name: 'Yoga',
    aliases: [],
    met: {light: 2.5, moderate: 3.3, vigorous: 4.0},
  },
  {
    name: 'Football',
    aliases: ['soccer'],
    met: {light: 5.0, moderate: 7.0, vigorous: 10.0},
  },
  {
    name: 'Tennis',
    aliases: [],
    met: {light: 4.5, moderate: 7.3, vigorous: 8.0},
  },
];

export const DEFAULT_STRENGTH_MET: Record<Intensity, number> = {
  light: 3.5,
  moderate: 5.0,
  vigorous: 6.0,
};
