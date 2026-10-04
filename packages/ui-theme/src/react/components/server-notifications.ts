export const notifyServerChange = async <T extends string>(
  notify: ((value: T) => void | Promise<void>) | undefined,
  value: T,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    await notify?.(value);
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause));

    try {
      if (onError) onError(error);
      else console.error('Theme server notification failed:', error);
    } catch (reportingError) {
      console.error('Theme server error handler failed:', reportingError);
    }
  }
};
