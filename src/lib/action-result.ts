type ActionFailure = {
  ok: false;
  code: string;
  message: string;
};

export class UserFacingError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'UserFacingError';
  }
}

export function actionFailure(code: string, message: string): ActionFailure {
  return { ok: false, code, message };
}

export async function withExpectedError<T>(
  operation: () => Promise<T>,
): Promise<T | ActionFailure> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof UserFacingError) {
      return actionFailure(error.code, error.message);
    }

    throw error;
  }
}

export function isActionFailure(result: unknown): result is ActionFailure {
  return (
    typeof result === 'object' &&
    result !== null &&
    'ok' in result &&
    result.ok === false &&
    'message' in result &&
    typeof result.message === 'string'
  );
}
