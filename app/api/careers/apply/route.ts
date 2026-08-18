import { careersSchemaError, DEFAULT_CAREER_PAGE, isJobRoleOpen } from '@/lib/careers'
import { dbError, jsonError, jsonOk, parseJson } from '@/lib/api/http'
import { createClient } from '@/lib/supabase/server'
import type { CareerPageSettings, JobRole } from '@/lib/types'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST(request: Request) {
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')
  if (text(body.company_website, 200)) return jsonOk({ ok: true }, 201)

  const name = text(body.name, 120)
  const email = text(body.email, 160).toLowerCase()
  const coverLetter = text(body.cover_letter, 8000)
  if (name.length < 2) return jsonError('Please tell us your name.')
  if (!EMAIL.test(email)) return jsonError('Enter a valid email address.')
  if (coverLetter.length < 40) return jsonError('Write a short note about why you want to join — at least a few sentences.')

  const supabase = await createClient()
  const roleId = typeof body.role_id === 'string' && body.role_id.trim() ? body.role_id.trim() : null

  const { data: settings, error: settingsError } = await supabase
    .from('career_page_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  if (careersSchemaError(settingsError)) {
    return jsonError('Careers tables are not initialized. Run scripts/012_careers.sql in the Supabase SQL editor.', 503)
  }
  if (settingsError) return dbError(settingsError, 'Unable to submit application.')

  const page = (settings as CareerPageSettings | null) ?? DEFAULT_CAREER_PAGE

  if (roleId) {
    const { data: role, error: roleError } = await supabase.from('job_roles').select('*').eq('id', roleId).maybeSingle()
    if (roleError) return dbError(roleError, 'Unable to submit application.')
    if (!role || !isJobRoleOpen(role as JobRole)) return jsonError('This role is no longer accepting applications.')
  } else if (!page.accept_general) {
    return jsonError('We are only accepting applications for listed roles right now.')
  }

  const { error } = await supabase.from('job_applications').insert({
    role_id: roleId,
    name,
    email,
    phone: text(body.phone, 40),
    location: text(body.location, 120),
    portfolio_url: text(body.portfolio_url, 400),
    linkedin_url: text(body.linkedin_url, 400),
    resume_url: text(body.resume_url, 400),
    cover_letter: coverLetter,
    status: 'new',
  })
  if (error) return dbError(error, 'Unable to submit application.', 400)
  return jsonOk({ ok: true }, 201)
}
