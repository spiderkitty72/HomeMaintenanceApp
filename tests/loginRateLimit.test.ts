import { describe, expect, it } from "vitest";
import { clearLoginFailures, getClientIp, isLoginBlocked, recordLoginFailure } from "@/lib/loginRateLimit";

describe("login rate limit", () => {
    it("blocks an email after 5 failures and unblocks after 15 minutes", () => {
        const t = 1_000_000;
        const email = "limit-a@example.com";
        for (let i = 0; i < 4; i++) recordLoginFailure(email, null, t);
        expect(isLoginBlocked(email, null, t)).toBe(false);
        recordLoginFailure(email, null, t);
        expect(isLoginBlocked(email, null, t)).toBe(true);
        expect(isLoginBlocked(email.toUpperCase(), null, t)).toBe(true);
        expect(isLoginBlocked(email, null, t + 15 * 60 * 1000 + 1)).toBe(false);
    });

    it("blocks an IP after 20 failures across different emails", () => {
        const t = 2_000_000;
        for (let i = 0; i < 20; i++) recordLoginFailure(`spray${i}@example.com`, "10.1.1.1", t);
        expect(isLoginBlocked("someone-new@example.com", "10.1.1.1", t)).toBe(true);
        expect(isLoginBlocked("someone-new@example.com", "10.1.1.2", t)).toBe(false);
    });

    it("clears an email's failures after a successful login", () => {
        const t = 3_000_000;
        const email = "limit-b@example.com";
        for (let i = 0; i < 5; i++) recordLoginFailure(email, null, t);
        clearLoginFailures(email);
        expect(isLoginBlocked(email, null, t)).toBe(false);
    });

    it("reads the client IP from proxy headers", () => {
        expect(getClientIp(new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } }))).toBe("1.2.3.4");
        expect(getClientIp(new Request("http://x", { headers: { "x-real-ip": "5.6.7.8" } }))).toBe("5.6.7.8");
        expect(getClientIp(new Request("http://x"))).toBeNull();
        expect(getClientIp(undefined)).toBeNull();
    });
});
