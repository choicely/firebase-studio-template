#!/usr/bin/env node
import path from 'node:path'
import { spawn } from 'node:child_process'

import express from 'express'
import compression from 'compression'

const [, , rootArg, portArg] = process.argv

if (!rootArg || !portArg) {
  console.error('Usage: serve-compressed.mjs PATH PORT')
  process.exit(1)
}

const root = path.resolve(rootArg)

if (!/^\d+$/.test(String(portArg))) {
  console.error('ERROR: PORT must be a number')
  process.exit(1)
}
const port = Number(portArg)

const HOST = '127.0.0.1'
const app = express()

const shouldCompress = (req, res) => {
  return !req.headers['x-no-compression']
}

function writeCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Preview-Token')
  res.setHeader('Access-Control-Max-Age', '86400')
}

function send(res, status, body) {
  writeCors(res)
  res.status(status)
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(body)
}

function requirePreviewToken(req, res, next) {
  // Let CORS preflight through; browser usually won't include custom headers here.
  if (req.method === 'OPTIONS') return next()

  const expected = process.env.PREVIEW_TOKEN
  if (!expected) {
    return send(res, 500, 'ERROR: PREVIEW_TOKEN is not set\n')
  }

  const got = req.header('x-preview-token')
  if (!got || got !== expected) {
    return send(res, 401, 'Unauthorized\n')
  }

  return next()
}

function runRelease(res) {
  const cmd = 'source ~/.bashrc && ./scripts/release.sh'
  const child = spawn('bash', ['-lc', cmd], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  })

  let out = ''
  let err = ''

  child.stdout.on('data', (d) => (out += d.toString()))
  child.stderr.on('data', (d) => (err += d.toString()))

  child.on('close', (code) => {
    if (code === 0) return send(res, 200, 'OK\n')
    send(res, 500, `FAILED (exit ${code})\n\n${err || out}\n`)
  })
}

/**
 * Non-static endpoint(s)
 * Auth: x-preview-token must match PREVIEW_TOKEN
 */
app.use('/__release', requirePreviewToken)

app.options('/__release', (req, res) => {
  send(res, 204, '')
})

app.post('/__release', (req, res) => {
  runRelease(res)
})

app.all('/__release', (req, res) => {
  send(res, 405, 'Method not allowed\n')
})

app.use(
  compression({
    threshold: 0, // compress all sizes
    filter: shouldCompress,
  }),
)

app.use(
  express.static(root, {
    etag: true,
    lastModified: true,
    maxAge: 60 * 60 * 1000,
    fallthrough: false,
  }),
)

app.listen(port, HOST, () => {
  console.log(`Serving ${root} at http://${HOST}:${port}`)
})
