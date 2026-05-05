'use client';

/**
 * AI HR Assistant
 *
 * Three-pane chat UI:
 *  - Left rail: previous conversations (in-memory for the demo)
 *  - Center: streaming chat thread
 *  - Right rail: suggested prompts and capability tour
 *
 * The page calls /api/ai/chat which streams plain text back. We progressively
 * decode and append to the active assistant message so the experience feels
 * like Claude / ChatGPT.
 *
 * In production the conversation list is sourced from the ai_conversations
 * table scoped to the current user_id + org_id by RLS.
 */

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, MessageSquarePlus, BookOpenText, Users, BarChart3, ClipboardList, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Message = { role: 'user' | 'assistant'; content: string };
type Conversation = { id: string; title: string; updatedAt: string; messages: Message[] };

const seedConversations: Conversation[] = [
  {
    id: 'c1',
    title: 'Q4 workforce summary',
    updatedAt: 'Today',
    messages: [
      { role: 'user', content: 'Give me a workforce summary for this quarter' },
      {
        role: 'assistant',
        content:
          'Workforce snapshot: 25 active employees across 5 departments, with 3 open requisitions. Operations and Engineering account for the majority of headcount; Sales is growing fastest. No major retention concerns this quarter.',
      },
    ],
  },
  {
    id: 'c2',
    title: 'Senior engineer onboarding plan',
    updatedAt: 'Yesterday',
    messages: [
      { role: 'user', content: 'Draft an onboarding checklist for a senior engineer' },
      {
        role: 'assistant',
        content:
          'Here is a starter checklist:\n\n1. Day 1 — orientation, hardware, SSO\n2. Week 1 — codebase walkthrough with tech lead\n3. Week 2 — first small change shipped\n4. 30/60/90 day check-ins scheduled with manager and HR',
      },
    ],
  },
  {
    id: 'c3',
    title: 'PTO policy refresher',
    updatedAt: '3 days ago',
    messages: [
      { role: 'user', content: 'Summarize our time off policy' },
      {
        role: 'assistant',
        content:
          '15 vacation days, 10 sick days, 5 personal days per year. Vacation accrues biweekly. Manager approval is required, with HR override available.',
      },
    ],
  },
];

const suggestions = [
  { icon: BookOpenText, label: 'Summarize our PTO policy', prompt: 'Summarize our PTO policy in plain language for new hires.' },
  { icon: ClipboardList, label: 'Onboarding checklist', prompt: 'Draft an onboarding checklist for a senior software engineer.' },
  { icon: FileText, label: 'Draft a job description', prompt: 'Draft a job description for a Senior Operations Manager based in Kansas City.' },
  { icon: Users, label: 'Performance review draft', prompt: 'Help me write a performance review draft. The employee exceeded expectations this cycle.' },
  { icon: BarChart3, label: 'Workforce summary', prompt: 'Give me a workforce summary for this quarter.' },
];

export default function AssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>(seedConversations);
  const [activeId, setActiveId] = useState<string>('new');
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = activeId === 'new' ? null : conversations.find((c) => c.id === activeId) ?? null;
  const messages = active ? active.messages : liveMessages;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, streaming]);

  function startNew() {
    setActiveId('new');
    setLiveMessages([]);
    setDraft('');
  }

  async function send(prompt: string) {
    if (!prompt.trim() || streaming) return;

    // If we are in a saved conversation, fork it into the live thread.
    let working = active ? [...active.messages] : [...liveMessages];
    working.push({ role: 'user', content: prompt });
    working.push({ role: 'assistant', content: '' });

    setActiveId('new');
    setLiveMessages(working);
    setDraft('');
    setStreaming(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: working.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) throw new Error('Request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setLiveMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: acc };
          return next;
        });
      }

      // Persist as a new conversation entry once streaming completes.
      const title = prompt.slice(0, 48) + (prompt.length > 48 ? '…' : '');
      const newConv: Conversation = {
        id: 'c' + (Date.now() % 10000),
        title,
        updatedAt: 'Just now',
        messages: [...working.slice(0, -1), { role: 'assistant', content: acc }],
      };
      setConversations((prev) => [newConv, ...prev]);
    } catch (err) {
      setLiveMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: 'assistant',
          content: 'Something went wrong reaching the assistant. Try again in a moment.',
        };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="HR Assistant"
        description="Ask about policies, draft documents, or summarize your workforce. Powered by your organization's data."
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Left rail — conversation history */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <Button variant="outline" className="w-full justify-start gap-2" onClick={startNew}>
            <MessageSquarePlus className="h-4 w-4" />
            New conversation
          </Button>

          <div className="rounded-md border border-border bg-card">
            <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Recent
            </div>
            <div className="border-t border-border">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveId(c.id);
                    setLiveMessages([]);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2.5 border-b border-border last:border-b-0 transition-colors',
                    activeId === c.id ? 'bg-accent/5' : 'hover:bg-muted/50',
                  )}
                >
                  <div className="text-sm text-foreground line-clamp-1">{c.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.updatedAt}</div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center — chat */}
        <section className="col-span-12 lg:col-span-6">
          <div className="rounded-md border border-border bg-card flex flex-col h-[680px]">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
              <div className="h-7 w-7 rounded-sm bg-accent/10 text-accent flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="text-sm font-medium">PeopleFlow Assistant</div>
                <div className="text-xs text-muted-foreground">Grounded in your company data</div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
                  <div className="h-12 w-12 rounded-md bg-accent/10 text-accent flex items-center justify-center mb-4">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-medium text-foreground">How can I help?</h3>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    I can answer policy questions, draft job descriptions, summarize headcount, and write performance reviews.
                  </p>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={cn('flex gap-3', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {m.role === 'assistant' && (
                    <div className="h-7 w-7 shrink-0 rounded-sm bg-accent/10 text-accent flex items-center justify-center">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-md px-3.5 py-2.5 text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap',
                      m.role === 'user'
                        ? 'bg-foreground text-background'
                        : 'bg-muted/40 text-foreground border border-border',
                    )}
                  >
                    {m.content || (streaming && i === messages.length - 1 ? '…' : '')}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(draft);
              }}
              className="border-t border-border p-3 flex items-center gap-2"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask about policies, draft a JD, summarize headcount…"
                className="flex-1 h-10 px-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
                disabled={streaming}
              />
              <Button type="submit" disabled={streaming || !draft.trim()} className="gap-2">
                <Send className="h-4 w-4" />
                Send
              </Button>
            </form>
          </div>
        </section>

        {/* Right rail — suggestions */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="rounded-md border border-border bg-card p-4">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Try asking
            </div>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s.prompt)}
                  disabled={streaming}
                  className="w-full text-left px-3 py-2.5 rounded-sm border border-border bg-background hover:border-accent/40 hover:bg-accent/5 transition-colors flex items-start gap-2.5 disabled:opacity-50"
                >
                  <s.icon className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border bg-card p-4">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
              About this assistant
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The assistant is grounded in your organization's directory, departments, policies, and PTO data. It does not have access to compensation or sensitive documents unless you explicitly grant it.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
