import https from 'https';

const apiKey = process.env.N8N_API_KEY;
const baseUrl = process.env.N8N_INSTANCE_URL;

if (!apiKey || !baseUrl) {
  console.error("Missing N8N_API_KEY or N8N_INSTANCE_URL");
  process.exit(1);
}

const cleanedBaseUrl = baseUrl.replace(/\/$/, '');
const url = new URL(`${cleanedBaseUrl}/api/v1/workflows`);

const options = {
  hostname: url.hostname,
  port: url.port || 443,
  path: url.pathname,
  method: 'GET',
  headers: {
    'X-N8N-API-KEY': apiKey,
    'Accept': 'application/json'
  }
};

console.log(`Checking workflows at: ${cleanedBaseUrl}...`);

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const data = JSON.parse(body);
      console.log(`Found ${data.data.length} workflow(s).`);
      data.data.forEach(wf => {
        console.log(`- [${wf.id}] ${wf.name} (Active: ${wf.active})`);
      });
    } else {
      console.error(`Failure: ${res.statusCode} - ${body}`);
    }
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

req.end();
