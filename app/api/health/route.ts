import { createClient } from '@/lib/supabase/server'
import { jsonOk } from '@/lib/api/http'

export async function GET() {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').select('id').limit(1)
  return jsonOk({
    ok: !error,
    database: error ? 'uninitialized' : 'ready',
    time: new Date().toISOString(),
  })
}
