import { jsonOk } from '@/lib/api/http'
import { DEFAULT_PRESS_PAGE, normalizePressPage, pressSchemaError } from '@/lib/press'
import { createClient } from '@/lib/supabase/server'
import type { PressPage } from '@/lib/types'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('press_pages').select('*').eq('id', 1).maybeSingle()

  if (pressSchemaError(error) || error || !data) {
    return jsonOk({ data: DEFAULT_PRESS_PAGE })
  }

  return jsonOk({ data: normalizePressPage(data as PressPage) })
}
