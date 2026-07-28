import { describe, it, expect, beforeEach } from "vitest";
import { isEmailAllowed } from "@/lib/authAllowList";

describe("isEmailAllowed", () => {
  beforeEach(() => {
    process.env.SEED_SUPERUSER_EMAIL = "leonardecojt@gmail.com";
    process.env.ALLOWED_EMAIL_DOMAIN = "superozonoglobal.com";
  });

  it("allows the seed superuser email", () => {
    expect(isEmailAllowed("leonardecojt@gmail.com")).toBe(true);
  });

  it("allows any email on the allowed domain", () => {
    expect(isEmailAllowed("maria.fuentes@superozonoglobal.com")).toBe(true);
  });

  it("is case-insensitive on both the superuser email and the domain", () => {
    expect(isEmailAllowed("Leonardecojt@Gmail.com")).toBe(true);
    expect(isEmailAllowed("Maria@SuperOzonoGlobal.com")).toBe(true);
  });

  it("rejects an email outside the allowed domain and not the superuser", () => {
    expect(isEmailAllowed("random@gmail.com")).toBe(false);
  });

  it("rejects an empty email", () => {
    expect(isEmailAllowed("")).toBe(false);
  });

  it("does not allow a domain suffix match that is not a real subdomain boundary", () => {
    expect(isEmailAllowed("attacker@evilsuperozonoglobal.com")).toBe(false);
  });
});
