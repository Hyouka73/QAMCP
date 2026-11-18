import { createRequire } from 'node:module';
import console from 'node:console';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const repo = 'C:/Users/Judirico/Documents/QAMCP/QAMCP';
const out = 'C:/Users/Judirico/Documents/QAMCP/rescate-evidence/20261105-integracion';
const require = createRequire(repo + '/packages/mcp/package.json');
const { Client } = await import(pathToFileURL(require.resolve('@modelcontextprotocol/sdk/client/index.js')));
const { InMemoryTransport } = await import(pathToFileURL(require.resolve('@modelcontextprotocol/sdk/inMemory.js')));
const { createMcpServer } = await import(pathToFileURL(repo + '/packages/mcp/dist/index.js'));
const root = mkdtempSync(join(out, 'lifecycle-first-cause-'));
const server = createMcpServer({ projectRoots: [root] });
const client = new Client({ name: 'lifecycle-first-cause', version: '1' }, { capabilities: {} });
const [a,b] = InMemoryTransport.createLinkedPair();
const records = [];
async function call(name,args={}) {
  const res = await client.callTool({name,arguments:{targetPath:root,...args}});
  const payload = JSON.parse(res.content[0].text);
  records.push({name,args,isError:res.isError,payload});
  return payload;
}
try {
  await server.connect(b); await client.connect(a);
  await call('qap_init',{baseUrl:'http://localhost:3000'});
  await call('qap_context_set',{
    framework:'react',app_type:'spa',objective:'Validar flujo de compras y autenticación',
    critical_flows:[{name:'login',description:'Flujo de login'},{name:'checkout',description:'Flujo de checkout'}],
    roles:[{name:'admin',description:'Administrador'},{name:'customer',description:'Cliente'}],
    source_of_truth:{type:'prd',declared:true,ref:'prd-inline'},
  });
  await call('qap_session_plan',{plan:[{module:'auth',path:'/login',priority:'high'},{module:'pagos',path:'/pay',priority:'medium'}],auth:{required:false}});
  await call('qap_discover',{name:'auth',path:'/login'});
  await call('qap_status');
  await call('qap_rules_set',{module:'auth',view:'default',category_waivers:[{category:'proposito',reason:'Razón suficientemente larga de waiver'}]});
  await call('qap_module_close',{module:'auth',action:'close',user_confirmed:true});
  writeFileSync(join(out,'lifecycle-first-cause.json'),JSON.stringify(records,null,2));
  console.log(records.map(r=>({name:r.name,status:r.payload.status,code:r.payload.code,next:r.payload.siguiente_accion?.tipo})));
} finally {
  await client.close(); await server.close();
  rmSync(root,{recursive:true,force:true});
}
