import { createSupabaseContext } from 'npm:@supabase/server'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }

const schema = { type: 'object', properties: { items: { type: 'array', maxItems: 12, items: { type: 'object', properties: { kind: { type: 'string', enum: ['task', 'payment'] }, title: { type: 'string' }, client: { type: 'string' }, dueDate: { type: 'string', format: 'date' }, priority: { type: 'string', enum: ['low', 'medium', 'high'] }, amount: { type: ['number', 'null'] }, currency: { type: ['string', 'null'], enum: ['USD', 'EUR', 'BRL', 'AOA', 'GBP', 'Other', null] } }, required: ['kind','title','client','dueDate','priority','amount','currency'], additionalProperties: false } } }, required: ['items'], additionalProperties: false }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const auth = await createSupabaseContext(req, { auth: 'user' })
  if (auth.error) return Response.json({ message: auth.error.message }, { status: auth.error.status, headers: corsHeaders })
  try {
    const body = await req.json()
    const text = typeof body.text === 'string' ? body.text.trim() : ''
    const today = typeof body.today === 'string' ? body.today : ''
    const timezone = typeof body.timezone === 'string' ? body.timezone : 'UTC'
    if (!text || text.length > 4000) return Response.json({ message: 'Invalid text.' }, { status: 400, headers: corsHeaders })
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) return Response.json({ message: 'GEMINI_API_KEY is not configured.' }, { status: 500, headers: corsHeaders })
    const prompt = 'You are LifeDue task and payment extraction engine. Today is ' + today + '. User timezone: ' + timezone + '. Convert the user note into actionable items. Return one item per distinct task or payment. Use kind=payment only for explicit money/payment/charging/receiving/invoice mentions. Never invent an amount, client, or deadline. Keep client names exactly as written by the user. Never translate, anglicize, normalize, autocorrect, or replace a person's name (for example, João must remain João). Preserve accents and spelling exactly. Resolve relative dates from the supplied today. If only a weekday is given, use its next occurrence. Payment amount/currency should be null when not stated. Use concise action titles without client names. User note:\n\n' + text
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(apiKey), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.1 } }) })
    if (!response.ok) { console.error('Gemini request failed:', await response.text()); return Response.json({ message: 'Gemini request failed.' }, { status: 502, headers: corsHeaders }) }
    const result = await response.json()
    const raw = result?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof raw !== 'string') throw new Error('Gemini returned no structured output.')
    return Response.json(JSON.parse(raw), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) { console.error('quick-add function failed:', error); return Response.json({ message: 'Could not process Quick Add.' }, { status: 500, headers: corsHeaders }) }
})