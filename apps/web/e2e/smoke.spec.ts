import { expect, test } from '@playwright/test'

/**
 * Smoke tests que rodam mesmo em modo demo (sem Supabase/Stripe/DB reais).
 * Validam que as rotas públicas e o rewrite de modo demo funcionam.
 */

test.describe('rotas públicas', () => {
  test('landing renderiza com headline e CTAs', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Residência Med/)
    await expect(page.getByRole('heading', { name: /Aprovação em residência/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Começar grátis/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Ver planos/i })).toBeVisible()
  })

  test('landing lista as bancas cobertas', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('AMRIGS', { exact: true })).toBeVisible()
    await expect(page.getByText('ENARE', { exact: true })).toBeVisible()
    // exact: true evita colisão com "FMRP-USP"
    await expect(page.getByText('USP', { exact: true })).toBeVisible()
  })

  test('/precos mostra os 3 planos com preços', async ({ page }) => {
    await page.goto('/precos')
    await expect(page.getByRole('heading', { name: /Escolha o ritmo/i })).toBeVisible()
    // exact: true evita que 'Pro' colida com o h1 'Escolha o ritmo da sua aprovação' (contém 'pro')
    await expect(page.getByRole('heading', { name: 'Free', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pro', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Premium', exact: true })).toBeVisible()
    // Preços formatados em BRL
    await expect(page.getByText(/R\$\s*0,00/)).toBeVisible()
    await expect(page.getByText(/R\$\s*19,00/)).toBeVisible()
    await expect(page.getByText(/R\$\s*39,00/)).toBeVisible()
  })

  test('/precos destaca o plano Pro como "Mais escolhido"', async ({ page }) => {
    await page.goto('/precos')
    await expect(page.getByText(/Mais escolhido/i)).toBeVisible()
  })
})

test.describe('modo demo (sem Supabase real)', () => {
  test('/dashboard reescreve para /setup com checklist de credenciais', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText(/Modo de demonstração/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /Bem-vindo ao Residência Med/i })).toBeVisible()
    await expect(page.getByText('Supabase (autenticação)')).toBeVisible()
    await expect(page.getByText('Postgres + pgvector')).toBeVisible()
  })

  test('/org reescreve para /setup', async ({ page }) => {
    await page.goto('/org')
    await expect(page.getByText(/Modo de demonstração/i)).toBeVisible()
  })

  test('/mentor reescreve para /setup', async ({ page }) => {
    await page.goto('/mentor')
    await expect(page.getByText(/Modo de demonstração/i)).toBeVisible()
  })

  test('/convite/{token-aleatorio} reescreve para /setup', async ({ page }) => {
    await page.goto('/convite/abc123')
    await expect(page.getByText(/Modo de demonstração/i)).toBeVisible()
  })
})

test.describe('healthcheck', () => {
  test('/api/health responde JSON com status', async ({ request }) => {
    const r = await request.get('/api/health')
    // 200 quando DB ok, 503 quando DB offline (modo demo)
    expect([200, 503]).toContain(r.status())
    const body = await r.json()
    expect(body).toHaveProperty('status')
    expect(body).toHaveProperty('checks')
    expect(body.checks).toHaveProperty('server')
  })
})

test.describe('headers de segurança', () => {
  test('/ tem headers de segurança configurados', async ({ request }) => {
    const r = await request.get('/')
    expect(r.headers()['x-frame-options']).toBe('DENY')
    expect(r.headers()['x-content-type-options']).toBe('nosniff')
    expect(r.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin')
  })
})
