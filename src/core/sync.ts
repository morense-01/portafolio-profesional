/** Sincronización: cola de cambios + fusión sin sobrescribir en silencio. Lógica pura (transporte inyectable). */
export interface Change { id: string; entity: string; entityId: string; op: 'upsert' | 'delete'; payload: Record<string, unknown>; updatedAt: number; status: 'pending' | 'synced' | 'conflict' }
export interface Remote { entityId: string; entity: string; payload: Record<string, unknown>; updatedAt: number; deleted?: boolean }
export interface Conflict { entity: string; entityId: string; local: Change; remote: Remote }
export interface Transport { pull(since: number): Promise<Remote[]>; push(c: Change): Promise<void> }

export function enqueue(q: Change[], c: Omit<Change, 'id' | 'status'>, id: string): Change[] {
  // Colapsa cambios pendientes de la misma entidad: queda el más reciente.
  return [...q.filter((x) => !(x.status === 'pending' && x.entity === c.entity && x.entityId === c.entityId)), { ...c, id, status: 'pending' }];
}

/** Conflicto = remoto modificado después de la última sincronización Y local pendiente con contenido distinto. */
export async function sync(queue: Change[], t: Transport, lastSync: number, now = Date.now()): Promise<{ queue: Change[]; applied: Remote[]; conflicts: Conflict[]; lastSync: number }> {
  const remote = await t.pull(lastSync);
  const byKey = new Map(remote.map((r) => [`${r.entity}:${r.entityId}`, r]));
  const conflicts: Conflict[] = []; const applied: Remote[] = []; const out: Change[] = [];
  for (const c of queue) {
    if (c.status !== 'pending') { out.push(c); continue; }
    const r = byKey.get(`${c.entity}:${c.entityId}`);
    if (r && r.updatedAt > lastSync && JSON.stringify(r.payload) !== JSON.stringify(c.payload)) {
      conflicts.push({ entity: c.entity, entityId: c.entityId, local: c, remote: r });
      out.push({ ...c, status: 'conflict' }); byKey.delete(`${c.entity}:${c.entityId}`); continue;
    }
    await t.push(c); out.push({ ...c, status: 'synced' }); byKey.delete(`${c.entity}:${c.entityId}`);
  }
  for (const r of byKey.values()) applied.push(r); // remotos sin cambio local: se aplican
  return { queue: out, applied, conflicts, lastSync: now };
}
/** Resolución explícita elegida por el usuario. */
export function resolve(q: Change[], conflict: Conflict, keep: 'local' | 'remote'): Change[] {
  return q.map((c) => (c.id === conflict.local.id ? { ...c, status: keep === 'local' ? 'pending' : 'synced', updatedAt: keep === 'local' ? Date.now() : c.updatedAt } : c));
}

/** Transporte Supabase (PostgREST) con el JWT del usuario; RLS aplica en servidor. NO verificado contra un proyecto real. */
export function supabaseTransport(url: string, anonKey: string, jwt: string): Transport {
  const h = { apikey: anonKey, Authorization: `Bearer ${jwt}`, 'content-type': 'application/json' };
  return {
    async pull(since) {
      const r = await fetch(`${url}/rest/v1/sync_records?updated_at=gt.${since}&select=*`, { headers: h });
      if (!r.ok) throw new Error('pull failed');
      return ((await r.json()) as any[]).map((x) => ({ entity: x.entity, entityId: x.entity_id, payload: x.payload, updatedAt: x.updated_at, deleted: x.deleted }));
    },
    async push(c) {
      const r = await fetch(`${url}/rest/v1/sync_records`, { method: 'POST', headers: { ...h, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ entity: c.entity, entity_id: c.entityId, payload: c.payload, updated_at: c.updatedAt, deleted: c.op === 'delete' }) });
      if (!r.ok) throw new Error('push failed');
    },
  };
}
