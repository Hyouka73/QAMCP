/**
 * Test script for MCP Server via StdioClientTransport
 * Simulates Cursor / Claude Desktop / Antigravity connecting to the QAP MCP Server.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { resolve } from 'node:path';

const CLI_PATH = resolve(process.cwd(), 'packages', 'cli', 'dist', 'entrypoint.js');

async function testMcpServer() {
  console.log('====================================================');
  console.log('     Probando Servidor MCP QAP vía StdioTransport   ');
  console.log('====================================================\n');

  const useNpx = process.argv.includes('--npx');
  console.log(`Modo de ejecución: ${useNpx ? 'npx -y @hyouka73/qap-cli mcp' : `node ${CLI_PATH} mcp`}`);

  const transport = new StdioClientTransport(
    useNpx
      ? { command: 'npx', args: ['-y', '@hyouka73/qap-cli@latest', 'mcp'] }
      : { command: 'node', args: [CLI_PATH, 'mcp'] }
  );

  const client = new Client(
    {
      name: 'qap-test-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    console.log('✔ Conexión Stdio establecida con éxito con QAP MCP Server.\n');

    // 1. Listar Tools disponibles
    console.log('--- 1. Consultando herramientas disponibles (tools/list) ---');
    const toolsResult = await client.listTools();
    console.log(`Herramientas encontradas (${toolsResult.tools.length}):`);
    for (const tool of toolsResult.tools) {
      console.log(`  🔧 ${tool.name}: ${tool.description}`);
    }

    // 2. Invocar herramienta qap_status
    console.log('\n--- 2. Probando invocación de herramienta: qap_status ---');
    const statusResult = await client.callTool({
      name: 'qap_status',
      arguments: {},
    });
    console.log('Respuesta recibida del MCP Server:');
    console.log(statusResult.content[0].text);

    // 3. Invocar herramienta qap_init (modo prueba)
    console.log('\n--- 3. Probando invocación de herramienta: qap_init ---');
    const initResult = await client.callTool({
      name: 'qap_init',
      arguments: {
        projectName: 'mcp-live-test',
        environments: ['local', 'qa'],
        baseUrl: 'http://localhost:3000',
      },
    });
    console.log('Respuesta recibida del MCP Server:');
    console.log(initResult.content[0].text);

    console.log('\n====================================================');
    console.log('  ✔ SERVIDOR MCP FUNCIONANDO AL 100% SOBRE STDIO!   ');
    console.log('====================================================\n');
  } catch (error) {
    console.error('Error durante la prueba del MCP Server:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testMcpServer();
