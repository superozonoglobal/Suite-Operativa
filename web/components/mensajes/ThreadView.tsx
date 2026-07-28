"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Message = { id: string; senderId: string; content: string; createdAt: string | Date };

export function ThreadView({
  currentUserId,
  otherUserId,
  otherUserName,
  initialMessages,
}: {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  initialMessages: Message[];
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!content.trim()) return;
    setSending(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: otherUserId, content }),
    });
    setContent("");
    setSending(false);
    router.refresh();
  }

  return (
    <div className="flex max-w-2xl flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      {initialMessages.length === 0 ? (
        <p className="text-sm text-[var(--text-faint)]">Sin mensajes todavía.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {initialMessages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                m.senderId === currentUserId
                  ? "self-end bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "self-start bg-[var(--bg-elevated)] text-[var(--text)]"
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={`Responder a ${otherUserName}...`}
          className="flex-1 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm text-[var(--text)]"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="rounded-full bg-gradient-to-br from-[var(--accent-dim)] to-[#00a050] px-4 py-2 text-sm font-semibold text-white"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
