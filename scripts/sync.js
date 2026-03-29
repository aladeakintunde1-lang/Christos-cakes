const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const N8N_BASE_URL = process.env.N8N_BASE_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;
const WORKFLOW_PATH = path.join(__dirname, '../n8n/workflow.json');

async function syncWorkflow() {
  if (!N8N_BASE_URL || !N8N_API_KEY) {
    console.error('N8N_BASE_URL and N8N_API_KEY must be set.');
    process.exit(1);
  }

  if (!fs.existsSync(WORKFLOW_PATH)) {
    console.error('n8n/workflow.json not found.');
    process.exit(1);
  }

  const workflow = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));
  const workflowId = workflow.id;

  const url = workflowId 
    ? `${N8N_BASE_URL}/api/v1/workflows/${workflowId}`
    : `${N8N_BASE_URL}/api/v1/workflows`;

  const method = workflowId ? 'PUT' : 'POST';

  console.log(`Syncing workflow to n8n (${method} ${url})...`);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflow)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to sync workflow:', data);
      process.exit(1);
    }

    if (!workflowId) {
      console.log('--------------------------------------------------');
      console.log('✓ New workflow created in n8n!');
      console.log(`ACTION REQUIRED: Add this ID to n8n/workflow.json: ${data.id}`);
      console.log('--------------------------------------------------');
    } else {
      console.log('✓ Workflow updated in n8n.');
    }
  } catch (error) {
    console.error('Error syncing workflow:', error);
    process.exit(1);
  }
}

syncWorkflow();
