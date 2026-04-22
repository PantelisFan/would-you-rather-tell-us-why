type ClientLogLevel = 'debug' | 'info' | 'warn' | 'error';

function isDebugEnabled() {
  if (import.meta.env.DEV) {
    return true;
  }

  try {
    return window.localStorage.getItem('wyr:debug') === '1';
  } catch {
    return false;
  }
}

export function clientLog(
  level: ClientLogLevel,
  scope: string,
  message: string,
  meta?: Record<string, unknown>,
) {
  if (!isDebugEnabled()) {
    return;
  }

  const prefix = `[wyr:${scope}] ${message}`;
  const sink =
    level === 'debug'
      ? console.debug.bind(console)
      : level === 'info'
        ? console.info.bind(console)
        : level === 'warn'
          ? console.warn.bind(console)
          : console.error.bind(console);

  if (meta && Object.keys(meta).length > 0) {
    sink(prefix, meta);
    return;
  }

  sink(prefix);
}