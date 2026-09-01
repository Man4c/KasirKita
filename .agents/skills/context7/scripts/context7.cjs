#!/usr/bin/env node

/**
 * Context7 Documentation Lookup (Node.js cross-platform runner)
 * Usage:
 *   node context7.cjs search <query>
 *   node context7.cjs docs <library-id> [topic] [mode]
 */

const https = require('https');

const API_KEY = process.env.CONTEXT7_API_KEY || '';
const BASE_URL = 'https://context7.com/api/v2';

function request(urlPath) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(urlPath.startsWith('http') ? urlPath : `${BASE_URL}${urlPath}`);
    const headers = {
      'X-Context7-Source': 'antigravity-skill',
      'User-Agent': 'Context7-Antigravity/1.0'
    };
    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }

    const req = https.get(fullUrl, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
        resolve(data);
      });
    });

    req.on('error', err => reject(err));
  });
}

async function searchLibrary(query) {
  if (!query) {
    console.error('Usage: node context7.cjs search <query>');
    process.exit(1);
  }

  console.log(`Searching for: ${query}\n---`);
  try {
    const raw = await request(`/search?query=${encodeURIComponent(query)}`);
    const json = JSON.parse(raw);
    if (json.results && json.results.length > 0) {
      for (const item of json.results) {
        console.log(`ID: ${item.id}`);
        console.log(`Name: ${item.title || 'Unknown'}`);
        console.log(`Snippets: ${item.totalSnippets || 'N/A'} | Score: ${item.benchmarkScore || 'N/A'}`);
        console.log(`Description: ${(item.description || 'No description').slice(0, 100)}`);
        console.log('---');
      }
    } else if (json.error) {
      console.error(`Error: ${json.error}`);
    } else {
      console.log('No results found.');
    }
  } catch (err) {
    console.error(`Search failed: ${err.message}`);
  }
}

async function fetchDocs(libraryId, topic, mode = 'code') {
  if (!libraryId) {
    console.error('Usage: node context7.cjs docs <library-id> [topic] [mode]');
    process.exit(1);
  }

  const cleanedId = libraryId.replace(/^\//, '');
  let url = `/docs/${mode}/${cleanedId}?type=txt`;
  if (topic) {
    url += `&topic=${encodeURIComponent(topic)}`;
  }

  console.log(`Fetching docs: /${cleanedId}`);
  console.log(`Mode: ${mode}${topic ? ` | Topic: ${topic}` : ''}\n---`);

  try {
    const docs = await request(url);
    console.log(docs);
  } catch (err) {
    console.error(`Fetch failed: ${err.message}`);
  }
}

async function main() {
  const [,, cmd, ...args] = process.argv;

  if (cmd === 'search') {
    await searchLibrary(args.join(' '));
  } else if (cmd === 'docs') {
    await fetchDocs(args[0], args[1], args[2] || 'code');
  } else {
    console.log(`Context7 Documentation Lookup

Usage:
  node context7.cjs search <query>
  node context7.cjs docs <library-id> [topic] [mode]

Examples:
  node context7.cjs search react
  node context7.cjs docs /facebook/react hooks
  node context7.cjs docs /laravel/framework "eloquent relationships" code
`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
