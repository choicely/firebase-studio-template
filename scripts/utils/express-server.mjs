#!/usr/bin/env node
import express from 'express';
import compression from 'compression';
import path from 'node:path';

const [, , rootArg, portArg] = process.argv;

if (!rootArg || !portArg) {
  console.error('Usage: serve-compressed.mjs PATH PORT');
  process.exit(1);
}

const root = path.resolve(rootArg);
const port = Number(portArg);

const app = express();

const shouldCompress = (req, res) => {
  if (req.headers['x-no-compression']) {
    return false;
  }
  return true;
};

app.use(
  compression({
    threshold: 0,     // compress all sizes
    filter: shouldCompress,
  }),
);

app.use(
  express.static(root, {
    etag: true,
    lastModified: true,
    maxAge: 60 * 60 * 1000,
    fallthrough: false,
  }),
);

app.listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});
