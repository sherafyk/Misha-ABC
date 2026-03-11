import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { getAdminSessionCookieName, isValidAdminSessionToken } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get(getAdminSessionCookieName())?.value
  return isValidAdminSessionToken(token)
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 403 })
  }

  const { operation, payload } = (await request.json()) as { operation?: string; payload?: Record<string, unknown> }
  const supabase = createAdminClient()

  switch (operation) {
    case 'upsert_child_profile': {
      const { data, error } = await supabase.from('child_profile').upsert(payload).select('*').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ data })
    }
    case 'create_behavior': {
      const { data, error } = await supabase.from('behavior_definitions').insert(payload).select('*').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ data })
    }
    case 'update_behavior': {
      const { id, updates } = payload as { id: string; updates: Record<string, unknown> }
      const { error } = await supabase.from('behavior_definitions').update(updates).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ data: { id } })
    }
    case 'archive_behavior': {
      const { id } = payload as { id: string }
      const { error } = await supabase.from('behavior_definitions').update({ is_active: false }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ data: { id } })
    }
    case 'create_antecedent': {
      const { data, error } = await supabase
        .from('antecedent_options')
        .insert({ ...payload, is_custom: true })
        .select('*')
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ data })
    }
    case 'create_consequence': {
      const { data, error } = await supabase
        .from('consequence_options')
        .insert({ ...payload, is_custom: true })
        .select('*')
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ data })
    }
    case 'upsert_daily_log': {
      const { data, error } = await supabase.from('daily_logs').upsert(payload, { onConflict: 'log_date' }).select('*').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ data })
    }
    case 'create_daily_log': {
      const { data, error } = await supabase.from('daily_logs').insert(payload).select('*').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ data })
    }
    case 'update_daily_log': {
      const { id, updates } = payload as { id: string; updates: Record<string, unknown> }
      const { data, error } = await supabase.from('daily_logs').update(updates).eq('id', id).select('*').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ data })
    }
    case 'create_incident': {
      const rawPayload = (payload ?? {}) as Record<string, unknown>
      const antecedent_ids = Array.isArray(rawPayload.antecedent_ids) ? (rawPayload.antecedent_ids as string[]) : []
      const consequence_ids = Array.isArray(rawPayload.consequence_ids) ? (rawPayload.consequence_ids as string[]) : []
      const { antecedent_ids: _a, consequence_ids: _c, ...incidentPayload } = rawPayload
      const { data, error } = await supabase.from('incidents').insert(incidentPayload).select('*').single()
      if (error || !data) return NextResponse.json({ error: error?.message ?? 'Unable to create incident' }, { status: 400 })

      if (antecedent_ids.length > 0) {
        const { error: antecedentError } = await supabase.from('incident_antecedents').insert(
          antecedent_ids.map((antecedentId: string) => ({ incident_id: data.id, antecedent_id: antecedentId })),
        )
        if (antecedentError) return NextResponse.json({ error: antecedentError.message }, { status: 400 })
      }

      if (consequence_ids.length > 0) {
        const { error: consequenceError } = await supabase.from('incident_consequences').insert(
          consequence_ids.map((consequenceId: string) => ({ incident_id: data.id, consequence_id: consequenceId })),
        )
        if (consequenceError) return NextResponse.json({ error: consequenceError.message }, { status: 400 })
      }

      return NextResponse.json({ data })
    }
    case 'update_incident': {
      const { id, updates } = payload as { id: string; updates: Record<string, unknown> }
      const antecedent_ids = Array.isArray(updates.antecedent_ids) ? (updates.antecedent_ids as string[]) : undefined
      const consequence_ids = Array.isArray(updates.consequence_ids) ? (updates.consequence_ids as string[]) : undefined
      const { antecedent_ids: _a, consequence_ids: _c, ...incidentPayload } = updates

      if (Object.keys(incidentPayload).length > 0) {
        const { error } = await supabase.from('incidents').update(incidentPayload).eq('id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      }

      if (antecedent_ids) {
        await supabase.from('incident_antecedents').delete().eq('incident_id', id)
        if (antecedent_ids.length > 0) {
          const { error } = await supabase.from('incident_antecedents').insert(
            antecedent_ids.map((antecedentId: string) => ({ incident_id: id, antecedent_id: antecedentId })),
          )
          if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        }
      }

      if (consequence_ids) {
        await supabase.from('incident_consequences').delete().eq('incident_id', id)
        if (consequence_ids.length > 0) {
          const { error } = await supabase.from('incident_consequences').insert(
            consequence_ids.map((consequenceId: string) => ({ incident_id: id, consequence_id: consequenceId })),
          )
          if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        }
      }

      return NextResponse.json({ data: { id } })
    }
    case 'delete_incident': {
      const { id } = payload as { id: string }
      const { error } = await supabase.from('incidents').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ data: { id } })
    }
    default:
      return NextResponse.json({ error: 'Unsupported operation.' }, { status: 400 })
  }
}
