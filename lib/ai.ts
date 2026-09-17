import type {Message} from './chat';

export const MAX_AI_BYTES = 100_000;
export type AiMessage = {at: number; who: 'A' | 'B'; text: string};
export type AiInsight = {title: string; observation: string; evidence: string[]; suggestion: string; uncertainty: string};

// Calendar months have different lengths. Clamp the day rather than allowing
// JavaScript to roll a date such as November 31 into December.
export function aiWindow(now = new Date()) {
  const start = new Date(now);
  const day = start.getUTCDate();
  start.setUTCDate(1);
  start.setUTCMonth(start.getUTCMonth() - 3);
  const lastDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  start.setUTCDate(Math.min(day, lastDay));
  return {start: +start, end: +now};
}

export function prepareAiChat(chat: Message[], now = new Date()) {
  const window = aiWindow(now);
  const names = [...new Set(chat.map(message => message.who))];
  // Labels replace speaker headers, not identifying details inside messages.
  const messages: AiMessage[] = chat.filter(message => message.at >= window.start && message.at <= window.end)
    .map(message => ({at: message.at, who: message.who === names[0] ? 'A' : 'B', text: message.text}));
  const bytes = new TextEncoder().encode(JSON.stringify(messages)).length;
  return {messages, bytes, excluded: chat.length - messages.length, ...window};
}

// Validate the provider response before rendering it. React renders these
// strings as text; model-generated HTML is never executed.
export function parseInsights(value: unknown): AiInsight[] {
  const items = (value as {insights?: unknown})?.insights;
  if (!Array.isArray(items) || items.length < 1 || items.length > 4) throw Error('Invalid AI response');
  return items.map(item => {
    for (const key of ['title', 'observation', 'suggestion', 'uncertainty']) {
      if (typeof item?.[key] !== 'string' || !item[key].trim() || item[key].length > 2000) throw Error('Invalid AI response');
    }
    if (!Array.isArray(item.evidence) || item.evidence.length < 1 || item.evidence.length > 3 || item.evidence.some((text: unknown) => typeof text !== 'string' || text.length > 1000)) throw Error('Invalid AI response');
    return {title: item.title, observation: item.observation, evidence: item.evidence, suggestion: item.suggestion, uncertainty: item.uncertainty};
  });
}
