export function formatLogMeta(meta?: Record<string, unknown>) {
  if (!meta || Object.keys(meta).length === 0) {
    return '';
  }

  return ` ${JSON.stringify(meta, (_key, value) => {
    if (typeof value === 'string' && value.length > 160) {
      return `${value.slice(0, 157)}...`;
    }

    if (value instanceof Error) {
      return { name: value.name, message: value.message };
    }

    return value;
  })}`;
}

export function previewText(text: string, maxLength = 80) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}