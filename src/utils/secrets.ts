export function trimSecret(value: string | undefined): string {
  return value?.trim() ?? '';
}

export function maskSecret(value: string | undefined): string {
  const trimmed = trimSecret(value);
  if (!trimmed) {
    return '';
  }
  if (trimmed.length <= 8) {
    return '••••';
  }
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}
