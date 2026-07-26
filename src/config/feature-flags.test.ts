import { describe, expect, it } from 'vitest';
import {
  FEATURE_FLAG_ENVIRONMENT_VARIABLES,
  isFeatureEnabled,
  resolveFeatureFlags,
} from './feature-flags';

describe('feature flags', () => {
  it('defaults every flag to disabled', () => {
    expect(resolveFeatureFlags({})).toEqual({
      norwegianWedgeHomepage: false,
      norwegianLearningPaths: false,
      norwegianOnboarding: false,
      norwegianPathDashboard: false,
    });
  });

  it('reads explicitly configured boolean values', () => {
    const flags = resolveFeatureFlags({
      FEATURE_NORWEGIAN_WEDGE_HOMEPAGE: ' true ',
      FEATURE_NORWEGIAN_LEARNING_PATHS: 'TRUE',
      FEATURE_NORWEGIAN_ONBOARDING: 'false',
      FEATURE_NORWEGIAN_PATH_DASHBOARD: ' FALSE ',
    });

    expect(flags).toEqual({
      norwegianWedgeHomepage: true,
      norwegianLearningPaths: true,
      norwegianOnboarding: false,
      norwegianPathDashboard: false,
    });
  });

  it('treats an empty value as disabled', () => {
    expect(
      resolveFeatureFlags({
        FEATURE_NORWEGIAN_WEDGE_HOMEPAGE: ' ',
      }).norwegianWedgeHomepage,
    ).toBe(false);
  });

  it('rejects ambiguous values instead of enabling a flag accidentally', () => {
    expect(() =>
      resolveFeatureFlags({
        FEATURE_NORWEGIAN_ONBOARDING: 'yes',
      }),
    ).toThrowError(
      'Invalid FEATURE_NORWEGIAN_ONBOARDING feature flag. Expected "true" or "false".',
    );
  });

  it('checks a named flag from a resolved snapshot', () => {
    const flags = resolveFeatureFlags({
      FEATURE_NORWEGIAN_PATH_DASHBOARD: 'true',
    });

    expect(isFeatureEnabled('norwegianPathDashboard', flags)).toBe(true);
    expect(isFeatureEnabled('norwegianLearningPaths', flags)).toBe(false);
  });

  it('keeps the environment variable contract centralized', () => {
    expect(FEATURE_FLAG_ENVIRONMENT_VARIABLES).toEqual({
      norwegianWedgeHomepage: 'FEATURE_NORWEGIAN_WEDGE_HOMEPAGE',
      norwegianLearningPaths: 'FEATURE_NORWEGIAN_LEARNING_PATHS',
      norwegianOnboarding: 'FEATURE_NORWEGIAN_ONBOARDING',
      norwegianPathDashboard: 'FEATURE_NORWEGIAN_PATH_DASHBOARD',
    });
  });
});
