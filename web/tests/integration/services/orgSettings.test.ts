import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { getOrgSettings, updateOrgSettings } from "@/lib/services/orgSettings";

describe("orgSettings service", () => {
  afterAll(async () => {
    await prisma.orgSettings.deleteMany();
  });

  it("creates a default row on first read when none exists", async () => {
    const settings = await getOrgSettings();
    expect(settings).toBeDefined();
    expect(settings.allowedEmails).toEqual([]);
  });

  it("reuses the same row on subsequent reads (singleton)", async () => {
    const first = await getOrgSettings();
    const second = await getOrgSettings();
    expect(second.id).toBe(first.id);
  });

  it("rejects updates by a LIDER actor", async () => {
    await expect(
      updateOrgSettings({ allowedEmailDomain: "example.com" }, { level: "LIDER" })
    ).rejects.toThrow(/permission|forbidden/i);
  });

  it("rejects updates by a COLABORADOR actor", async () => {
    await expect(
      updateOrgSettings({ allowedEmailDomain: "example.com" }, { level: "COLABORADOR" })
    ).rejects.toThrow(/permission|forbidden/i);
  });

  it("allows a SUPERUSER to update the allow-list", async () => {
    const updated = await updateOrgSettings(
      { allowedEmailDomain: "superozonoglobal.com", allowedEmails: ["extra@example.com"] },
      { level: "SUPERUSER" }
    );
    expect(updated.allowedEmailDomain).toBe("superozonoglobal.com");
    expect(updated.allowedEmails).toEqual(["extra@example.com"]);
  });

  it("allows a PROJECT_MANAGER to update the allow-list", async () => {
    const updated = await updateOrgSettings(
      { allowedEmailDomain: "pm-test.com" },
      { level: "PROJECT_MANAGER" }
    );
    expect(updated.allowedEmailDomain).toBe("pm-test.com");
  });

  it("allows a PROJECT_MANAGER to toggle openRegistration", async () => {
    const updated = await updateOrgSettings({ openRegistration: true }, { level: "PROJECT_MANAGER" });
    expect(updated.openRegistration).toBe(true);
  });
});
