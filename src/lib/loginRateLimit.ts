/**
 * In-memory limit on failed logins. The app runs as a single container, so a
 * process-local map is enough; it resets when the container restarts.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_EMAIL = 5;
const MAX_FAILURES_PER_IP = 20;

type Entry = { count: number; resetAt: number };
const failures = new Map<string, Entry>();

function current(key: string, now: number): Entry | undefined {
    const entry = failures.get(key);
    if (entry && entry.resetAt <= now) {
        failures.delete(key);
        return undefined;
    }
    return entry;
}

function keys(email: string, ip: string | null) {
    const list = [{ key: `email:${email.toLowerCase()}`, max: MAX_FAILURES_PER_EMAIL }];
    if (ip) list.push({ key: `ip:${ip}`, max: MAX_FAILURES_PER_IP });
    return list;
}

export function isLoginBlocked(email: string, ip: string | null, now = Date.now()) {
    return keys(email, ip).some(({ key, max }) => (current(key, now)?.count ?? 0) >= max);
}

export function recordLoginFailure(email: string, ip: string | null, now = Date.now()) {
    for (const { key } of keys(email, ip)) {
        const entry = current(key, now);
        if (entry) entry.count += 1;
        else failures.set(key, { count: 1, resetAt: now + WINDOW_MS });
    }
    if (failures.size > 10000) {
        for (const [key, entry] of failures) if (entry.resetAt <= now) failures.delete(key);
    }
}

export function clearLoginFailures(email: string) {
    failures.delete(`email:${email.toLowerCase()}`);
}

export function getClientIp(request: Request | undefined): string | null {
    const forwarded = request?.headers?.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim() || null;
    return request?.headers?.get("x-real-ip") ?? null;
}
