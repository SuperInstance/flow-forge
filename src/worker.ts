import json from 'json';

interface Env {
  FLOWFORGE_KV: KVNamespace;
  DEEPSEEK_API_KEY: string;
}

const CSP = {
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
  'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src': "'self' https://fonts.gstatic.com",
  'img-src': "'self' data: https:",
  'connect-src': "'self' https://api.deepseek.com https://raw.githubusercontent.com https://*",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json', ...CSP },
  });
}

async function callLLM(key: string, system: string, user: string, model = 'deepseek-chat', maxTokens = 2000): Promise<string> {
  const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ], max_tokens: maxTokens, temperature: 0.5 })
  });
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

function stripFences(t: string): string {
  t = t.trim();
  while (t.startsWith('```')) { t = t.split('\n').slice(1).join('\n'); }
  while (t.endsWith('```')) { t = t.slice(0, -3).trim(); }
  for (const p of ['json', 'markdown']) { if (t.startsWith(p)) t = t.slice(p.length).trim(); }
  return t;
}

function getLanding(): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Flow Forge — Cocapn Fleet</title>
<style>
body{font-family:system-ui,sans-serif;background:#0a0a0f;color:#e0e0e0;margin:0;min-height:100vh}
a{color:#00E6D6;text-decoration:none}.container{max-width:800px;margin:0 auto;padding:40px 20px}
h1{color:#00E6D6;font-size:2.2em;margin-bottom:.2em}
.subtitle{color:#8A93B4;font-size:1.1em;margin-bottom:2em}
.card{background:#16161e;border:1px solid #2a2a3a;border-radius:12px;padding:24px;margin:20px 0}
.card h3{color:#00E6D6;margin:0 0 12px 0}
.btn{background:#00E6D6;color:#0a0a0f;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold}
.btn:hover{background:#00c4b5}
textarea{width:100%;background:#0a0a0f;color:#e0e0e0;border:1px solid #2a2a3a;border-radius:8px;padding:12px;font-family:monospace;box-sizing:border-box}
.flow-step{display:flex;align-items:center;gap:12px;margin:8px 0;padding:12px;background:#1a1a2a;border-radius:8px;border-left:3px solid #00E6D6}
.flow-step .step-num{color:#00E6D6;font-weight:bold;font-size:1.2em;min-width:30px}
.flow-step .arrow{color:#8A93B4;font-size:1.5em}
pre{background:#0a0a0f;padding:16px;border-radius:8px;overflow-x:auto;font-size:.85em;color:#8A93B4}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:20px 0}
.stat{text-align:center;padding:16px;background:#16161e;border-radius:8px;border:1px solid #2a2a3a}
.stat .num{font-size:2em;color:#00E6D6;font-weight:bold}
.stat .label{color:#8A93B4;font-size:.85em}
</style></head><body><div class="container">
<h1>🔗 Flow Forge</h1>
<p class="subtitle">Describe a goal in plain English. Get a fleet workflow that makes it happen.</p>

<div class="stats">
  <div class="stat"><div class="num" id="totalFlows">0</div><div class="label">Workflows Created</div></div>
  <div class="stat"><div class="num" id="totalSteps">0</div><div class="label">Steps Wired</div></div>
  <div class="stat"><div class="num" id="vesselsUsed">0</div><div class="label">Vessels Connected</div></div>
</div>

<div class="card">
  <h3>Describe Your Workflow</h3>
  <textarea id="goal" rows="3" placeholder="e.g. Monitor website uptime and send me a Slack message when it goes down..."></textarea>
  <div style="margin-top:12px">
    <button class="btn" onclick="forgeFlow()">Forge Workflow</button>
  </div>
</div>

<div id="result" style="display:none" class="card">
  <h3>Your Workflow</h3>
  <div id="steps"></div>
  <div style="margin-top:16px">
    <button class="btn" onclick="exportJSON()">Export JSON</button>
    <button class="btn" style="background:transparent;color:#00E6D6;border:1px solid #00E6D6;margin-left:8px" onclick="saveFlow()">Save to Fleet</button>
  </div>
  <pre id="jsonOutput" style="display:none"></pre>
</div>

<div id="saved" class="card"><h3>Saved Workflows</h3><p style="color:#8A93B4">Loading...</p></div>

<script>
let currentFlow = null;
async function forgeFlow() {
  const goal = document.getElementById('goal').value.trim();
  if (!goal) return;
  const btn = document.querySelector('.btn'); btn.textContent = 'Forging...'; btn.disabled = true;
  try {
    const r = await fetch('/api/forge', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({goal}) });
    currentFlow = await r.json();
    if (currentFlow.error) { alert(currentFlow.error); return; }
    document.getElementById('result').style.display = 'block';
    document.getElementById('steps').innerHTML = currentFlow.steps.map((s,i) =>
      '<div class="flow-step"><span class="step-num">' + (i+1) + '</span>' +
      '<div><strong>' + s.vessel + '</strong><br><span style="color:#8A93B4;font-size:.9em">' + s.action + '</span></div>' +
      (i < currentFlow.steps.length-1 ? '<span class="arrow">↓</span>' : '') +
      '</div>'
    ).join('');
    document.getElementById('totalFlows').textContent = (parseInt(document.getElementById('totalFlows').textContent)||0)+1;
    document.getElementById('totalSteps').textContent = (parseInt(document.getElementById('totalSteps').textContent)||0)+currentFlow.steps.length;
    const vessels = new Set(currentFlow.steps.map(s => s.vessel));
    document.getElementById('vesselsUsed').textContent = vessels.size;
  } catch(e) { alert('Error: ' + e.message); }
  btn.textContent = 'Forge Workflow'; btn.disabled = false;
}
function exportJSON() {
  if (!currentFlow) return;
  const el = document.getElementById('jsonOutput');
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
  el.textContent = JSON.stringify(currentFlow.spec, null, 2);
}
async function saveFlow() {
  if (!currentFlow) return;
  await fetch('/api/save', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(currentFlow) });
  alert('Workflow saved to fleet');
  loadSaved();
}
async function loadSaved() {
  try {
    const r = await fetch('/api/workflows');
    const flows = await r.json();
    const el = document.getElementById('saved');
    if (!flows.length) { el.innerHTML = '<h3>Saved Workflows</h3><p style="color:#8A93B4">No saved workflows yet.</p>'; return; }
    el.innerHTML = '<h3>Saved Workflows</h3>' + flows.map(f =>
      '<div style="padding:12px;background:#1a1a2a;border-radius:8px;margin:8px 0;border-left:3px solid #00E6D6">' +
      '<strong>' + f.name + '</strong> <span style="color:#8A93B4;font-size:.85em">' + f.steps.length + ' steps</span>' +
      '<p style="margin:4px 0;color:#8A93B4;font-size:.9em">' + f.goal + '</p></div>'
    ).join('');
  } catch(e) {}
}
loadSaved();
</script>
<div style="text-align:center;padding:24px;color:#475569;font-size:.75rem">
<a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> &middot;
<a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>
</div></body></html>`;
}

const FLEET_CAPABILITIES = {
  'cocapn': ['chat', 'reroute', 'config'],
  'the-seed': ['self-modify', 'branch', 'test'],
  'git-agent': ['commit', 'push', 'create-file'],
  'fleet-orchestrator': ['discover', 'health-check', 'event-bus'],
  'cocapn-equipment': ['equip', 'load-module', 'status'],
  'deckboss-ai': ['monitor', 'alert', 'voice'],
  'dmlog-ai': ['narrate', 'dice-roll', 'character'],
  'studylog-ai': ['teach', 'quiz', 'crystal-graph'],
  'makerlog-ai': ['code-review', 'refactor', 'generate'],
  'dead-reckoning-engine': ['storyboard', 'animate', 'iterate'],
  'increments-fleet-trust': ['score-trust', 'audit', 'escalate'],
  'luciddreamer-ai': ['generate-content', 'vote', 'trending'],
  'dogmind-arena': ['breed', 'dna-edit', 'compete'],
  'context-compactor': ['compress', 'summarize', 'extract'],
  'skill-evolver': ['propose-skill', 'accept', 'reject'],
  'personallog-ai': ['journal', 'reflect', 'track'],
  'businesslog-ai': ['crm', 'meeting', 'invoice'],
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/health') return json({ status: 'ok', vessel: 'flow-forge' });
    if (path === '/vessel.json') return json({
      name: 'flow-forge', type: 'cocapn-vessel', version: '1.0.0',
      description: 'Zero-code natural language workflow builder — describe a goal, get a fleet workflow',
      fleet: 'https://the-fleet.casey-digennaro.workers.dev',
      capabilities: ['nl-workflow', 'vessel-routing', 'flow-export']
    });

    if (path === '/api/workflows') {
      const flows = await env.FLOWFORGE_KV.get('workflows', 'json') || [];
      return json(flows);
    }

    if (path === '/api/forge' && request.method === 'POST') {
      const { goal } = await request.json();
      if (!goal) return json({ error: 'goal required' }, 400);

      const capStr = Object.entries(FLEET_CAPABILITIES).map(([k, v]) => `${k}: ${v.join(', ')}`).join('\n');

      const system = `You are a fleet workflow designer. Given a user goal and available fleet vessels with their capabilities, design a workflow that chains vessels together. Output a JSON array of steps. Each step: { vessel, action, description }. Be practical — only use vessels that exist. Max 6 steps.`;

      const user = `Goal: ${goal}\n\nAvailable fleet vessels:\n${capStr}\n\nDesign a workflow. Output ONLY a JSON array of steps.`;

      const raw = await callLLM(env.DEEPSEEK_API_KEY, system, user, 'deepseek-chat', 1500);
      let steps: any[];
      try {
        const cleaned = stripFences(raw);
        steps = JSON.parse(cleaned);
      } catch {
        steps = [{ vessel: 'cocapn', action: 'chat', description: 'Handle request via general chat' }];
      }

      const spec = { goal, steps, created: new Date().toISOString(), id: Date.now().toString() };
      return json({ ...spec, steps });
    }

    if (path === '/api/save' && request.method === 'POST') {
      const flow = await request.json();
      flow.name = flow.name || `Workflow ${Date.now()}`;
      const flows = await env.FLOWFORGE_KV.get('workflows', 'json') || [];
      flows.unshift(flow);
      if (flows.length > 50) flows.length = 50;
      await env.FLOWFORGE_KV.put('workflows', JSON.stringify(flows));
      return json({ saved: true, name: flow.name });
    }

    return new Response(getLanding(), { headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Content-Security-Policy': 'default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*; frame-ancestors 'none';', ...CSP } });
  }
};
