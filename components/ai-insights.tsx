import {useEffect, useRef, useState} from 'react';
import type {Message} from '@/lib/chat';
import {MAX_AI_BYTES, parseInsights, prepareAiChat, type AiInsight} from '@/lib/ai';

const origin = (import.meta.env?.VITE_AI_ORIGIN || '').replace(/\/$/, '');

export function AiInsights({chat}: {chat: Message[]}) {
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const controller = useRef<AbortController | null>(null);
  const prepared = prepareAiChat(chat);

  // A different import must not inherit consent or results from the old chat.
  useEffect(() => {
    controller.current?.abort();
    controller.current = null;
    setConsent(false); setInsights([]); setError(''); setBusy(false);
    return () => controller.current?.abort();
  }, [chat]);

  async function generate() {
    if (!consent || !origin || busy) return;
    const current = prepareAiChat(chat);
    if (!current.messages.length || current.bytes > MAX_AI_BYTES) return;
    const request = new AbortController();
    controller.current = request;
    setBusy(true); setError('');
    try {
      const response = await fetch(origin + '/api/insights', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, signal: request.signal,
        body: JSON.stringify({consent: true, messages: current.messages}),
      });
      const data = await response.json() as {error?: string; insights?: unknown};
      if (!response.ok) throw Error(data.error || 'AI analysis is unavailable. Please try later.');
      const parsed = parseInsights(data);
      if (!request.signal.aborted) setInsights(parsed);
    } catch (failure) {
      if (!request.signal.aborted) setError(failure instanceof Error ? failure.message : 'AI analysis failed.');
    } finally {
      if (controller.current === request && !request.signal.aborted) setBusy(false);
    }
  }

  return <section className="card full" aria-label="AI conversation insights">
    <h2>A closer look with AI</h2>
    <p>AI analysis covers only messages from {new Date(prepared.start).toLocaleDateString()} through today: the last three calendar months. Older messages stay out of the AI request.</p>
    <p>{prepared.messages.length.toLocaleString()} messages eligible · {prepared.excluded.toLocaleString()} outside this window.</p>
    {!origin ? <div className="note">AI analysis is being connected. Your local insights and suggestions are available now.</div> : <>
      {!prepared.messages.length && <div className="note">There are no messages from the last three months to analyse.</div>}
      {prepared.bytes > MAX_AI_BYTES && <div className="note">This recent conversation is too large for the current free AI limit. Export a smaller recent portion; we will not silently omit messages.</div>}
      <label className="inline" style={{alignItems: 'flex-start', lineHeight: 1.6}}>
        <input type="checkbox" checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)}/>
        <span>I have permission from both participants to send these recent messages to Cloudflare for AI analysis. Message text and timestamps will leave my device. Speaker labels become A/B, but names or private details within messages may remain. This is separate from usage analytics.</span>
      </label>
      <p><a href="https://developers.cloudflare.com/workers-ai/platform/data-usage/" target="_blank" rel="noreferrer">How Cloudflare handles AI data</a>. We do not save your messages or AI results on our backend.</p>
      <button className="primary" disabled={!consent || busy || !prepared.messages.length || prepared.bytes > MAX_AI_BYTES} onClick={() => void generate()}>{busy ? 'Reading your recent conversation…' : 'Analyse recent chat with AI'}</button>
      {busy && <button className="secondary" onClick={() => {controller.current?.abort(); setBusy(false);}}>Cancel</button>}
      {error && <p role="alert" className="error">{error}</p>}
    </>}
    {insights.map((insight, index) => <article key={index} style={{marginTop: 24}}>
      <h3>{insight.title}</h3><p>{insight.observation}</p>
      {insight.evidence.map((evidence, i) => <blockquote key={i}>{evidence}</blockquote>)}
      <p><strong>Try:</strong> {insight.suggestion}</p><small>{insight.uncertainty}</small>
    </article>)}
    <p><small>AI interpretations can be mistaken. They do not establish someone’s feelings or predict a relationship’s future. Cancelling stops this browser waiting; it cannot recall a request already sent.</small></p>
  </section>;
}
