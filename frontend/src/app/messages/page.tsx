"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useMe } from "@/lib/useMe";
import { MessagesApi } from "@/lib/api";
import { Empty } from "@/components/dashboards/shared";

function Messages() {
  const sp = useSearchParams();
  const { sessionStatus, userId } = useMe();
  const qc = useQueryClient();
  const [peer, setPeer] = useState<number | null>(sp.get("peer") ? Number(sp.get("peer")) : null);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const convos = useQuery({ queryKey: ["convos", userId], queryFn: () => MessagesApi.conversations(userId), enabled: !!userId, refetchInterval: 15000 });
  const thread = useQuery({ queryKey: ["thread", userId, peer], queryFn: () => MessagesApi.thread(userId, peer!), enabled: !!userId && !!peer, refetchInterval: 8000 });
  const send = useMutation({
    mutationFn: () => MessagesApi.send(userId, peer!, text),
    onSuccess: () => { setText(""); thread.refetch(); qc.invalidateQueries({ queryKey: ["convos", userId] }); },
  });

  useEffect(() => { endRef.current?.scrollIntoView(); }, [thread.data]);

  if (sessionStatus === "unauthenticated") return <Empty text="سجّل الدخول لعرض الرسائل." />;

  return (
    <div className="grid h-[70vh] gap-4 md:grid-cols-[280px_1fr]">
      {/* قائمة المحادثات */}
      <div className="card-brand overflow-y-auto">
        <h2 className="mb-3 font-semibold text-brand-dark">المحادثات</h2>
        {convos.isLoading ? <Empty text="…" /> : !convos.data?.length ? <Empty text="لا محادثات بعد." /> : (
          <ul className="space-y-1">
            {convos.data.map((c: any) => (
              <li key={c.peer_id}>
                <button onClick={() => setPeer(c.peer_id)}
                  className={`flex w-full items-center justify-between rounded-lg p-2 text-right text-sm ${peer === c.peer_id ? "bg-brand-light" : "hover:bg-muted"}`}>
                  <span className="truncate">
                    <span className="block font-medium text-brand-dark">{c.peer_name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{c.last_body}</span>
                  </span>
                  {c.unread > 0 && <span className="rounded-full bg-brand px-1.5 text-xs text-white">{c.unread}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* الرسائل */}
      <div className="card-brand flex flex-col">
        {!peer ? <div className="flex flex-1 items-center justify-center"><Empty text="اختر محادثة للبدء." /></div> : (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto pb-3">
              {thread.data?.map((m: any) => (
                <div key={m.message_id} className={`flex ${m.side === "me" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.side === "me" ? "bg-brand text-white" : "bg-muted text-foreground"}`}>
                    {m.body}
                    <span className="mt-1 block text-[10px] opacity-70">{m.created_at}</span>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) send.mutate(); }} className="flex gap-2 border-t pt-3">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب رسالة…"
                className="flex-1 rounded-lg border px-3 py-2 outline-none focus:border-brand" />
              <button type="submit" disabled={send.isPending || !text.trim()} className="btn-primary disabled:opacity-60">إرسال</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return <Suspense fallback={<p className="text-center text-muted-foreground">…</p>}><Messages /></Suspense>;
}
