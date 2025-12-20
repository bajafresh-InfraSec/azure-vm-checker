export const ANONYMOUS_LIMIT = 1;

export function checkAnonymousLimit() {
  const data = JSON.parse(localStorage.getItem('azsize_anonymous') || '{}');

  if (!data.checksUsed) {
    return { allowed: true, remaining: ANONYMOUS_LIMIT, used: 0 };
  }

  if (data.checksUsed >= ANONYMOUS_LIMIT) {
    return { allowed: false, remaining: 0, used: data.checksUsed };
  }

  return {
    allowed: true,
    remaining: ANONYMOUS_LIMIT - data.checksUsed,
    used: data.checksUsed
  };
}

export function incrementAnonymousUsage() {
  const data = JSON.parse(localStorage.getItem('azsize_anonymous') || '{}');
  data.checksUsed = (data.checksUsed || 0) + 1;
  data.lastCheckAt = new Date().toISOString();
  localStorage.setItem('azsize_anonymous', JSON.stringify(data));
}

export function resetAnonymousUsage() {
  localStorage.removeItem('azsize_anonymous');
}
