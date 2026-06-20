import { readFile } from 'node:fs/promises';
import { classifyTrafficSource } from '../src/data/geoKnowledge.ts';

async function readInput() {
  const filePath = process.argv[2];
  if (filePath) return readFile(filePath, 'utf8');

  if (process.stdin.isTTY) {
    throw new Error('Usage: npm run geo:crawlers -- path/to/access.log OR pipe log lines into the command.');
  }

  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function extractUserAgent(line) {
  const quoted = [...line.matchAll(/"([^"]*)"/g)].map((match) => match[1]);
  return quoted.at(-1) || line;
}

function extractPath(line) {
  const request = line.match(/"(GET|POST|HEAD|OPTIONS)\s+([^"\s]+)\s+HTTP\/[\d.]+"/i);
  if (request?.[2]) return request[2].split('?')[0];

  const url = line.match(/https?:\/\/[^/\s"]+([^\s"]*)/i);
  if (url?.[1]) return url[1].split('?')[0] || '/';

  return 'unknown';
}

async function main() {
  const input = await readInput();
  const lines = input.split(/\r?\n/).filter(Boolean);
  const summary = {
    totalLines: lines.length,
    categories: {},
    labels: {},
    topAiBotPaths: {},
  };

  for (const line of lines) {
    const userAgent = extractUserAgent(line);
    const result = classifyTrafficSource(userAgent);
    summary.categories[result.category] = (summary.categories[result.category] || 0) + 1;
    summary.labels[result.label] = (summary.labels[result.label] || 0) + 1;

    if (result.category === 'ai_bot') {
      const routePath = extractPath(line);
      summary.topAiBotPaths[routePath] = (summary.topAiBotPaths[routePath] || 0) + 1;
    }
  }

  summary.topAiBotPaths = Object.fromEntries(
    Object.entries(summary.topAiBotPaths).sort((a, b) => b[1] - a[1]).slice(0, 25),
  );

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
