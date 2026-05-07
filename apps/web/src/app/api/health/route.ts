import { NextResponse } from 'next/server'
import { prisma } from '@residencia-med/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, 'ok' | 'fail'> = { server: 'ok' }
  let dbError: string | undefined
  const url = process.env.DATABASE_URL ?? ''
  const urlInfo = {
    length: url.length,
    host: url.split('@')[1]?.split('/')[0] ?? null,
    hasUserDot: /:\/\/postgres\./.test(url),
  }
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.db = 'ok'
  } catch (e) {
    checks.db = 'fail'
    dbError = (e as Error).message?.substring(0, 300)
  }
  const allOk = Object.values(checks).every((v) => v === 'ok')
  return NextResponse.json(
    { status: allOk ? 'ok' : 'degraded', checks, ts: new Date().toISOString(), dbError, urlInfo },
    { status: allOk ? 200 : 503 },
  )
}
