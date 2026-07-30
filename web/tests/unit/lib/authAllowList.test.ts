import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { isEmailAllowed } from "@/lib/authAllowList";

describe("isEmailAllowed", () => {
  beforeEach(() => {
    process.env.SEED_SUPERUSER_EMAIL = "leonardecojt@gmail.com";
    process.env.ALLOWED_EMAIL_DOMAIN = "superozonoglobal.com";
  });

  afterEach(async () => {
    await prisma.orgSettings.deleteMany();
  });

  it("allows the seed superuser email", async () => {
    expect(await isEmailAllowed("leonardecojt@gmail.com")).toBe(true);
  });

  it("allows any email on the allowed domain", async () => {
    expect(await isEmailAllowed("maria.fuentes@superozonoglobal.com")).toBe(true);
  });

  it("is case-insensitive on both the superuser email and the domain", async () => {
    expect(await isEmailAllowed("Leonardecojt@Gmail.com")).toBe(true);
    expect(await isEmailAllowed("Maria@SuperOzonoGlobal.com")).toBe(true);
  });

  it("rejects an email outside the allowed domain and not the superuser", async () => {
    expect(await isEmailAllowed("random@gmail.com")).toBe(false);
  });

  it("rejects an empty email", async () => {
    expect(await isEmailAllowed("")).toBe(false);
  });

  it("does not allow a domain suffix match that is not a real subdomain boundary", async () => {
    expect(await isEmailAllowed("attacker@evilsuperozonoglobal.com")).toBe(false);
  });

  it("allows an email explicitly added to OrgSettings.allowedEmails", async () => {
    await prisma.orgSettings.create({
      data: { allowedEmails: ["contractor@gmail.com"] },
    });

    expect(await isEmailAllowed("contractor@gmail.com")).toBe(true);
  });

  it("is case-insensitive when matching OrgSettings.allowedEmails", async () => {
    await prisma.orgSettings.create({
      data: { allowedEmails: ["Contractor@Gmail.com"] },
    });

    expect(await isEmailAllowed("contractor@gmail.com")).toBe(true);
  });

  it("allows any email on OrgSettings.allowedEmailDomain", async () => {
    await prisma.orgSettings.create({
      data: { allowedEmailDomain: "partner-agency.com", allowedEmails: [] },
    });

    expect(await isEmailAllowed("someone@partner-agency.com")).toBe(true);
  });

  it("still rejects an email that matches neither env vars nor OrgSettings", async () => {
    await prisma.orgSettings.create({
      data: { allowedEmailDomain: "partner-agency.com", allowedEmails: ["contractor@gmail.com"] },
    });

    expect(await isEmailAllowed("random@gmail.com")).toBe(false);
  });

  it("allows any email when OrgSettings.openRegistration is true", async () => {
    await prisma.orgSettings.create({
      data: { allowedEmails: [], openRegistration: true },
    });

    expect(await isEmailAllowed("anyone-at-all@example.com")).toBe(true);
  });

  it("still enforces the allow-list when openRegistration is false", async () => {
    await prisma.orgSettings.create({
      data: { allowedEmails: [], openRegistration: false },
    });

    expect(await isEmailAllowed("anyone-at-all@example.com")).toBe(false);
  });
});
