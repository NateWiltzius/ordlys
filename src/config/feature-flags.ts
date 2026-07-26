export const FEATURE_FLAG_ENVIRONMENT_VARIABLES = {
  norwegianWedgeHomepage: 'FEATURE_NORWEGIAN_WEDGE_HOMEPAGE',
  norwegianLearningPaths: 'FEATURE_NORWEGIAN_LEARNING_PATHS',
  norwegianOnboarding: 'FEATURE_NORWEGIAN_ONBOARDING',
  norwegianPathDashboard: 'FEATURE_NORWEGIAN_PATH_DASHBOARD',
} as const;

export type FeatureFlagName = keyof typeof FEATURE_FLAG_ENVIRONMENT_VARIABLES;
export type FeatureFlags = Readonly<Record<FeatureFlagName, boolean>>;
type FeatureFlagEnvironment = Readonly<Record<string, string | undefined>>;

export function resolveFeatureFlags(environment: FeatureFlagEnvironment): FeatureFlags {
  return Object.freeze({
    norwegianWedgeHomepage: readFeatureFlag(environment, 'norwegianWedgeHomepage'),
    norwegianLearningPaths: readFeatureFlag(environment, 'norwegianLearningPaths'),
    norwegianOnboarding: readFeatureFlag(environment, 'norwegianOnboarding'),
    norwegianPathDashboard: readFeatureFlag(environment, 'norwegianPathDashboard'),
  });
}

// Resolve release flags on the server and pass individual booleans to client components.
export const FEATURE_FLAGS = resolveFeatureFlags(process.env);

export function isFeatureEnabled(
  name: FeatureFlagName,
  flags: FeatureFlags = FEATURE_FLAGS,
): boolean {
  return flags[name];
}

function readFeatureFlag(environment: FeatureFlagEnvironment, name: FeatureFlagName): boolean {
  const environmentVariable = FEATURE_FLAG_ENVIRONMENT_VARIABLES[name];
  const configuredValue = environment[environmentVariable]?.trim().toLowerCase();

  if (!configuredValue) return false;
  if (configuredValue === 'true') return true;
  if (configuredValue === 'false') return false;

  throw new Error(`Invalid ${environmentVariable} feature flag. Expected "true" or "false".`);
}
