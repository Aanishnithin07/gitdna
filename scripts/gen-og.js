import { createCanvas } from 'canvas'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const WIDTH = 1200
const HEIGHT = 630
const canvas = createCanvas(WIDTH, HEIGHT)
const ctx = canvas.getContext('2d')

// Background
ctx.fillStyle = '#060b12'
ctx.fillRect(0, 0, WIDTH, HEIGHT)

// Grid lines
ctx.strokeStyle = 'rgba(0,220,255,0.04)'
ctx.lineWidth = 1
for (let x = 0; x < WIDTH; x += 60) {
  ctx.beginPath()
  ctx.moveTo(x, 0)
  ctx.lineTo(x, HEIGHT)
  ctx.stroke()
}
for (let y = 0; y < HEIGHT; y += 60) {
  ctx.beginPath()
  ctx.moveTo(0, y)
  ctx.lineTo(WIDTH, y)
  ctx.stroke()
}

// Vignette
const vignette = ctx.createRadialGradient(WIDTH/2,HEIGHT/2,HEIGHT*0.3,WIDTH/2,HEIGHT/2,HEIGHT*0.9)
vignette.addColorStop(0, 'rgba(6,11,18,0)')
vignette.addColorStop(1, 'rgba(6,11,18,0.88)')
ctx.fillStyle = vignette
ctx.fillRect(0, 0, WIDTH, HEIGHT)

// Top border
ctx.strokeStyle = 'rgba(0,220,255,0.25)'
ctx.lineWidth = 1.5
ctx.beginPath(); ctx.moveTo(50,50); ctx.lineTo(WIDTH-50,50); ctx.stroke()
ctx.beginPath(); ctx.moveTo(50,HEIGHT-50); ctx.lineTo(WIDTH-50,HEIGHT-50); ctx.stroke()

// Corner brackets
const bracket = (x, y, s, d) => {
  ctx.strokeStyle = 'rgba(0,220,255,0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  if (d==='tl'){ ctx.moveTo(x,y+s); ctx.lineTo(x,y); ctx.lineTo(x+s,y) }
  if (d==='tr'){ ctx.moveTo(x-s,y); ctx.lineTo(x,y); ctx.lineTo(x,y+s) }
  if (d==='bl'){ ctx.moveTo(x,y-s); ctx.lineTo(x,y); ctx.lineTo(x+s,y) }
  if (d==='br'){ ctx.moveTo(x-s,y); ctx.lineTo(x,y); ctx.lineTo(x,y-s) }
  ctx.stroke()
}
bracket(50,50,20,'tl')
bracket(WIDTH-50,50,20,'tr')
bracket(50,HEIGHT-50,20,'bl')
bracket(WIDTH-50,HEIGHT-50,20,'br')

// System label
ctx.fillStyle = 'rgba(0,220,255,0.35)'
ctx.font = '500 13px monospace'
ctx.textAlign = 'left'
ctx.fillText('// DEVELOPER INTELLIGENCE SYSTEM v2.0', 70, 85)

// GIT in cyan
ctx.font = 'bold 118px monospace'
ctx.fillStyle = '#00dcff'
ctx.shadowColor = 'rgba(0,220,255,0.35)'
ctx.shadowBlur = 25
ctx.fillText('GIT', 70, 310)

// DNA in purple
ctx.fillStyle = '#b347ea'
ctx.shadowColor = 'rgba(179,71,234,0.35)'
ctx.fillText('DNA', 310, 310)
ctx.shadowBlur = 0

// Tagline
ctx.fillStyle = 'rgba(200,232,255,0.5)'
ctx.font = '300 26px monospace'
ctx.fillText('YOUR CODE HAS A FINGERPRINT. WE READ IT.', 70, 380)

// Divider
ctx.strokeStyle = 'rgba(0,220,255,0.18)'
ctx.lineWidth = 1
ctx.beginPath(); ctx.moveTo(70,418); ctx.lineTo(680,418); ctx.stroke()

// Feature pills
const features = ['AI PROFILING','TIME MACHINE','GITMAP','ROAST MODE','TRADING CARD']
let px = 70
ctx.font = '500 11px monospace'
features.forEach(f => {
  const w = ctx.measureText(f).width + 22
  ctx.strokeStyle = 'rgba(0,220,255,0.22)'
  ctx.lineWidth = 1
  ctx.strokeRect(px, 438, w, 24)
  ctx.fillStyle = 'rgba(0,220,255,0.45)'
  ctx.fillText(f, px+11, 455)
  px += w + 8
})

// URL bottom right
ctx.fillStyle = 'rgba(0,220,255,0.3)'
ctx.font = '500 17px monospace'
ctx.textAlign = 'right'
ctx.fillText('gitdna.xyz', WIDTH-65, HEIGHT-58)

// Score ring
const rx=970, ry=260, rr=95
ctx.strokeStyle = 'rgba(0,220,255,0.07)'
ctx.lineWidth = 9
ctx.beginPath(); ctx.arc(rx,ry,rr,0,Math.PI*2); ctx.stroke()
ctx.strokeStyle = '#00dcff'
ctx.shadowColor = 'rgba(0,220,255,0.45)'
ctx.shadowBlur = 12
ctx.lineWidth = 9
ctx.lineCap = 'round'
ctx.beginPath()
ctx.arc(rx,ry,rr,-Math.PI/2,-Math.PI/2+Math.PI*1.55)
ctx.stroke()
ctx.shadowBlur = 0
ctx.fillStyle = '#00dcff'
ctx.font = 'bold 46px monospace'
ctx.textAlign = 'center'
ctx.fillText('84', rx, ry+8)
ctx.fillStyle = 'rgba(0,220,255,0.38)'
ctx.font = '500 10px monospace'
ctx.fillText('DEV SCORE', rx, ry+28)

// Save
const buffer = canvas.toBuffer('image/png')
const publicDir = path.join(__dirname, '..', 'public')
fs.mkdirSync(publicDir, { recursive: true })
fs.writeFileSync(path.join(publicDir, 'og-image.png'), buffer)
console.log('OG image saved to public/og-image.png')