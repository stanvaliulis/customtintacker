/** Links identify records; they never grant authority or perform mutations. */
export function distributorReviewPath(id: string): string {
  return `/admin/distributors?application=${encodeURIComponent(id)}`;
}

export function safeAdminReturnPath(value: string | null): string {
  if (!value || /[\\\r\n]/.test(value)) return '/admin';
  try {
    const url = new URL(value, 'https://admin.invalid');
    if (url.origin !== 'https://admin.invalid' || !value.startsWith('/')) return '/admin';
    if (url.pathname !== '/admin/distributors') return '/admin';
    const id = url.searchParams.get('application');
    return id ? distributorReviewPath(id) : '/admin/distributors';
  } catch { return '/admin'; }
}

export function isSameOriginAdminMutation(request: Request): boolean {
  const origin = request.headers.get('origin');
  return origin === new URL(request.url).origin &&
    request.headers.get('sec-fetch-site') !== 'cross-site' &&
    request.headers.get('content-type')?.split(';')[0].trim() === 'application/json';
}
