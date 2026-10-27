const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Workflows
  listWorkflows:    ()              => request('/workflows'),
  getWorkflow:      (id)            => request(`/workflows/${id}`),
  createWorkflow:   (data)          => request('/workflows',          { method: 'POST', body: data }),
  updateWorkflow:   (id, data)      => request(`/workflows/${id}`,      { method: 'PUT',  body: data }),
  deleteWorkflow:   (id)            => request(`/workflows/${id}`,      { method: 'DELETE' }),
  toggleWorkflow:   (id)            => request(`/workflows/${id}/toggle`, { method: 'PATCH' }),
  duplicateWorkflow:(id)            => request(`/workflows/${id}/duplicate`, { method: 'POST' }),
  triggerWorkflow:  (id, input)     => request(`/workflows/${id}/trigger`, { method: 'POST', body: { input } }),
  validateGraph:    (nodes, edges)  => request('/workflows/validate',  { method: 'POST', body: { nodes, edges } }),

  // Runs
  listRuns:    (workflowId, limit=50) => request(`/runs?${workflowId ? `workflowId=${workflowId}&` : ''}limit=${limit}`),
  getRun:      (id)                   => request(`/runs/${id}`),
  getNodeRuns: (runId)                => request(`/runs/${runId}/node-runs`),
  cancelRun:   (runId)                => request(`/runs/${runId}/cancel`, { method: 'POST' }),

  // Dead-Letter Queue (DLQ)
  listDeadLetters:   (replayState) => request(`/dead-letters${replayState ? `?replayState=${replayState}` : ''}`),
  getDeadLetter:     (id)          => request(`/dead-letters/${id}`),
  replayDeadLetter:  (id)          => request(`/dead-letters/${id}/replay`,  { method: 'POST' }),
  discardDeadLetter: (id)          => request(`/dead-letters/${id}/discard`, { method: 'POST' }),

  // Platform Statistics & Health
  getStats:  () => request('/stats'),
  getHealth: () => fetch('/health').then(r => r.json()),

  // SSE Live Stream
  streamRun: (runId) => new EventSource(`/api/runs/${runId}/stream`),

  // Webhook trigger simulation
  sendWebhook: async (workflowId, payload) => {
    const res = await fetch(`/webhooks/${workflowId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Webhook failed');
    }
    return res.json();
  },
};
