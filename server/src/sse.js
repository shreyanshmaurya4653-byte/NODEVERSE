/* SSE Manager – keeps track of all live subscribers per run */

const clients = new Map(); // runId → Map<clientId, res>
const globalClients = new Map(); // clientId → res

export const sse = {
  /** Register a new SSE client for a run */
  add(runId, clientId, res) {
    if (!clients.has(runId)) clients.set(runId, new Map());
    clients.get(runId).set(clientId, res);
    globalClients.set(clientId, res);
  },

  /** Remove a client (on disconnect) */
  remove(runId, clientId) {
    globalClients.delete(clientId);
    const group = clients.get(runId);
    if (!group) return;
    group.delete(clientId);
    if (group.size === 0) clients.delete(runId);
  },

  /** Emit an event to all clients subscribed to a run */
  emit(runId, event, data) {
    const group = clients.get(runId);
    if (!group) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of group.values()) {
      try { res.write(payload); } catch { /* client disconnected */ }
    }
  },

  /** Emit an event to all global subscribers */
  broadcast(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of globalClients.values()) {
      try { res.write(payload); } catch { /* ignore */ }
    }
  },

  /** Convenience: emit a node status update */
  nodeUpdate(runId, nodeRun) {
    sse.emit(runId, 'node_update', nodeRun);
  },

  /** Convenience: emit a run status update */
  runUpdate(runId, run) {
    sse.emit(runId, 'run_update', run);
  },
};
