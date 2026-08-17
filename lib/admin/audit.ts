import type { createClient as createServerSupabase } from '@/lib/supabase/server'

type Supabase = Awaited<ReturnType<typeof createServerSupabase>>

export async function writeAudit(
  supabase: Supabase,
  input: {
    actorId: string
    action: string
    entityType: string
    entityId?: string | null
    metadata?: Record<string, unknown>
  },
) {
  const { error } = await supabase.from('audit_logs').insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  })
  if (error) console.error('[unimart:audit]', error.message)
}
