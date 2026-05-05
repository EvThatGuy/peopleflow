/**
 * POST /api/ai/chat
 *
 * AI HR Assistant endpoint. Provider priority:
 *   1. Anthropic (claude-sonnet-4-20250514)  if ANTHROPIC_API_KEY
 *   2. OpenAI                                if OPENAI_API_KEY
 *   3. Deterministic mock                    otherwise
 *
 * Streams text chunks as Server-Sent style plain text so the page can render
 * tokens progressively. The assistant is grounded in the demo organization's
 * context (employee count, departments, policies) via a system prompt.
 *
 * HARDENING — production:
 *  - Pull org context from Supabase using the requesting user's session, not
 *    the demo data module.
 *  - Persist messages to ai_conversations / ai_messages with org_id + user_id
 *    so RLS scopes history per tenant.
 *  - Rate-limit per user_id + org_id (Redis or Upstash).
 *  - Strip / redact PII before sending to third-party providers if your DPA
 *    requires it; consider zero-data-retention endpoints.
 */
import { NextRequest } from 'next/server';
import { departments, employees, getActiveEmployees, getOpenJobs } from '@/lib/demo-data';

export const runtime = 'nodejs';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

function buildSystemPrompt() {
  const active = getActiveEmployees().length;
  const total = employees.length;
  const open = getOpenJobs().length;
  const deptSummary = departments
    .map((d) => `${d.name} (${d.headcount})`)
    .join(', ');

  return [
    'You are the PeopleFlow HR Assistant, an AI helper embedded inside the PeopleFlow HR platform.',
    'You help HR managers, people leaders, and employees with HR policy questions, onboarding tasks, performance review drafts, job description drafts, and workforce summaries.',
    '',
    'Tone: concise, professional, plain-spoken. Never use emojis. Never use exclamation marks unless quoting source material.',
    'Format: short paragraphs and tight bullet lists. Use bold sparingly for the single most important phrase.',
    '',
    'Current organization context (Northwind Logistics demo tenant):',
    `- Active employees: ${active} of ${total} on payroll`,
    `- Departments: ${deptSummary}`,
    `- Open requisitions: ${open}`,
    '- PTO policy: 15 vacation days, 10 sick days, 5 personal days per year, accrued biweekly',
    '- Standard work week: 40 hours, US holidays observed per company calendar',
    '',
    'When asked for a draft (job description, review, policy), produce a clean, ready-to-edit draft. When asked a factual question you cannot answer from the context above, say so plainly and suggest where the user can find the answer in PeopleFlow (for example: People > [Employee] > Documents).',
    'Never fabricate employee names, salaries, or sensitive personal data.',
  ].join('\n');
}

async function streamAnthropic(messages: ChatMessage[]): Promise<Response> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: buildSystemPrompt(),
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

async function streamOpenAI(messages: ChatMessage[]): Promise<Response> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!res.ok || !res.body) {
    return new Response('OpenAI request failed', { status: 502 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = res.body.getReader();

  const readable = new ReadableStream({
    async start(controller) {
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';
          for (const part of parts) {
            const line = part.replace(/^data:\s*/, '').trim();
            if (!line || line === '[DONE]') continue;
            try {
              const json = JSON.parse(line);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              /* ignore malformed chunk */
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

/**
 * Mock provider — used when no API keys are configured. Produces deterministic
 * canned responses keyed off intent so demos stay coherent.
 */
function streamMock(messages: ChatMessage[]): Response {
  const last = messages[messages.length - 1]?.content.toLowerCase() ?? '';

  let answer = '';
  if (/policy|pto|time off|vacation|sick/.test(last)) {
    answer = [
      "Here's a quick summary of the company time off policy:",
      '',
      '- 15 vacation days per year, accrued biweekly (4.62 hours per pay period)',
      '- 10 sick days per year, granted on January 1',
      '- 5 personal days per year, use-it-or-lose-it',
      '- Requests should be submitted at least two weeks in advance for vacations longer than three days',
      '- Manager approval is required; HR can override in exceptional cases',
      '',
      'Employees can submit a request from the Time Off page.',
    ].join('\n');
  } else if (/onboard|new hire|checklist/.test(last)) {
    answer = [
      'Standard onboarding checklist for a new hire:',
      '',
      '1. Send signed offer letter and complete I-9 verification',
      '2. Provision laptop, email, and SSO accounts',
      '3. Schedule day-one orientation with HR',
      '4. Assign onboarding buddy on the team',
      '5. Add to relevant Slack channels and project tools',
      '6. Schedule 30-day, 60-day, and 90-day check-ins',
      '7. Confirm direct deposit and benefits enrollment',
      '',
      'You can apply this template from Onboarding > Templates.',
    ].join('\n');
  } else if (/job description|jd|posting/.test(last)) {
    answer = [
      'Here is a starting draft. Adjust the seniority signal and required skills before posting.',
      '',
      '**About the role**',
      'We are hiring a candidate who will own end-to-end delivery within their team, partner closely with cross-functional stakeholders, and raise the bar on quality. This role reports to the team lead and works on a hybrid schedule.',
      '',
      '**What you will do**',
      '- Lead scoped initiatives from discovery to launch',
      '- Collaborate with peers across product, design, and operations',
      '- Mentor newer team members and contribute to team rituals',
      '',
      '**What we look for**',
      '- 4+ years of relevant experience',
      '- Strong written communication and stakeholder management',
      '- Track record of shipping in a fast-moving environment',
    ].join('\n');
  } else if (/review|performance|feedback/.test(last)) {
    answer = [
      'Performance review draft — replace bracketed prompts with specifics.',
      '',
      '**Strengths**',
      '[Employee] consistently delivered on commitments this cycle, particularly around [project]. Their work on [example] raised the standard for the team.',
      '',
      '**Areas to develop**',
      'Stretch opportunity in [skill]. Recommend pairing with [peer or program] over the next quarter.',
      '',
      '**Goals for next cycle**',
      '- Lead [initiative] end-to-end',
      '- Improve [metric] by [target]',
      '- Mentor at least one junior team member',
    ].join('\n');
  } else if (/headcount|workforce|report|summary/.test(last)) {
    const active = getActiveEmployees().length;
    const open = getOpenJobs().length;
    answer = [
      `Workforce snapshot: ${active} active employees across ${departments.length} departments, with ${open} open requisitions.`,
      '',
      'Department breakdown:',
      ...departments.map((d) => `- ${d.name}: ${d.headcount}`),
      '',
      'Pipeline is healthy heading into next quarter. Watch the Operations team — turnover ticked up two points last month.',
    ].join('\n');
  } else if (/hello|hi |hey|help/.test(last)) {
    answer = [
      'I can help with HR policy questions, onboarding checklists, job description drafts, performance review drafts, and workforce summaries.',
      '',
      'A few things to try:',
      '- "Summarize our PTO policy"',
      '- "Draft an onboarding checklist for a senior engineer"',
      '- "Give me a workforce summary for this quarter"',
    ].join('\n');
  } else {
    answer = [
      "I don't have a specific answer for that yet, but I can help draft policies, summarize headcount, write job descriptions, or build onboarding checklists.",
      '',
      'Tell me a bit more about what you need and I will take a pass at a draft.',
    ].join('\n');
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      // Token-ish chunking so the UI animates like a real stream.
      const tokens = answer.split(/(\s+)/);
      for (const t of tokens) {
        controller.enqueue(encoder.encode(t));
        await new Promise((r) => setTimeout(r, 18));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: ChatMessage[] };

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('messages array required', { status: 400 });
  }

  try {
    if (process.env.ANTHROPIC_API_KEY) return await streamAnthropic(messages);
    if (process.env.OPENAI_API_KEY) return await streamOpenAI(messages);
    return streamMock(messages);
  } catch (err) {
    console.error('AI chat error', err);
    // Graceful fallback to mock so the demo never breaks.
    return streamMock(messages);
  }
}
