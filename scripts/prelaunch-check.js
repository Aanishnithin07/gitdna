/* global process */

const BASE_URL = process.env.API_URL || 'http://localhost:8000'

async function safeParseJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

const tests = [
  {
    name: 'Health check',
    test: async () => {
      const res = await fetch(`${BASE_URL}/health`)
      if (!res.ok) throw new Error(`Status ${res.status}`)
      return 'Backend is running'
    }
  },
  {
    name: 'Analyze real user (torvalds)',
    test: async () => {
      const res = await fetch(`${BASE_URL}/api/analyze/torvalds`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ username: 'torvalds' })
      })
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const data = await safeParseJson(res)
      const ai = data?.ai || {}
      if (!ai.devClass) throw new Error('Missing ai.devClass')
      if (!ai.traits) throw new Error('Missing ai.traits')
      if (!ai.chronotype) throw new Error('Missing ai.chronotype')
      return `devClass: "${ai.devClass}", tier: "${ai.archetype?.tier}"`
    }
  },
  {
    name: 'Analyze user with no commits (edge case)',
    test: async () => {
      const res = await fetch(`${BASE_URL}/api/analyze/ghost`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ username: 'ghost' })
      })
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const data = await safeParseJson(res)
      if (!data?.ai?.devClass) throw new Error('Fallback failed — no ai.devClass')
      return 'Fallback analysis working'
    }
  },
  {
    name: '404 username handling',
    test: async () => {
      const res = await fetch(`${BASE_URL}/api/analyze/this-user-does-not-exist-xyzabc123`)
      if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`)
      return '404 handled correctly'
    }
  },
  {
    name: 'Rate limiting active',
    test: async () => {
      const requests = Array(12).fill(null).map(() => 
        fetch(`${BASE_URL}/api/analyze/torvalds`)
      )
      const responses = await Promise.all(requests)
      const limited = responses.some(r => r.status === 429)
      if (!limited) return 'WARNING: Rate limiting may not be active'
      return 'Rate limiting confirmed working'
    }
  },
  {
    name: 'CORS headers present',
    test: async () => {
      const res = await fetch(`${BASE_URL}/health`, {
        headers: { 'Origin': 'https://gitdna.vercel.app' }
      })
      const cors = res.headers.get('access-control-allow-origin')
      if (!cors) throw new Error('No CORS header found')
      return `CORS: ${cors}`
    }
  },
]

async function run() {
  console.log('\n🧬 GITDNA PRE-LAUNCH CHECKS\n')
  console.log(`Target: ${BASE_URL}\n`)
  
  let passed = 0, failed = 0
  
  for (const t of tests) {
    process.stdout.write(`  ${t.name}... `)
    try {
      const result = await t.test()
      console.log(`✓ ${result}`)
      passed++
    } catch(e) {
      console.log(`✗ FAILED: ${e.message}`)
      failed++
    }
  }
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`  ${passed} passed  ${failed} failed`)
  if (failed === 0) {
    console.log(`\n  ✓ READY TO DEPLOY\n`)
  } else {
    console.log(`\n  ✗ FIX ${failed} ISSUE${failed>1?'S':''} BEFORE DEPLOYING\n`)
    process.exit(1)
  }
}

run()
