import fs from 'fs';
import https from 'https';
import { URL } from 'url';

const apiKey = process.env.N8N_API_KEY;
const baseUrl = process.env.N8N_INSTANCE_URL;

if (!apiKey || !baseUrl) {
  console.error("Missing N8N_API_KEY or N8N_INSTANCE_URL");
  process.exit(1);
}

const cleanedBaseUrl = baseUrl.replace(/\/$/, '');
const workflowFilePath = './n8n/master_workflow.json';

if (!fs.existsSync(workflowFilePath)) {
  console.error(`Workflow file not found at ${workflowFilePath}`);
  process.exit(1);
}

const workflow = JSON.parse(fs.readFileSync(workflowFilePath, 'utf8'));
const data = JSON.stringify(workflow);

const url = new URL(`${cleanedBaseUrl}/api/v1/workflows`);

const options = {
  hostname: url.hostname,
  port: url.port || 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'X-N8N-API-KEY': apiKey,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log(`Connecting to n8n instance: ${cleanedBaseUrl}...`);

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const responseData = JSON.parse(body);
      console.log(`✅ Success! Christos Cakes Automation has been pushed to your n8n account.`);
      console.log(`Workflow ID: ${responseData.id}`);
      console.log(`Status: Active (Please review credentials inside n8n)`);
    } else {
      console.error(`❌ Failure: ${res.statusCode} - ${body}`);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Connection Error: ${e.message}`);
  process.exit(1);
});

req.write(data);
req.end();
