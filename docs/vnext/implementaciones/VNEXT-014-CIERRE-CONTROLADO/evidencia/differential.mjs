import fs from 'node:fs';
import console from 'node:console';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const repo='C:/Users/Judirico/Documents/QAMCP/QAMCP';
const out='C:/Users/Judirico/Documents/QAMCP/rescate-evidence/20261105-integracion';
const req=createRequire(repo+'/package.json');
const ts=req('typescript');
const baseline='6ce7472bc1cef8d252434a3d71a0a614ed06a390';
const changed=execFileSync('git',['diff','--name-only',baseline,'HEAD'],{cwd:repo,encoding:'utf8'}).trim().split('\n').filter(p=>p.endsWith('.ts'));
const originals=new Map();
for(const file of changed){try{originals.set(path.resolve(repo,file).toLowerCase(),execFileSync('git',['show',baseline+':'+file],{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','ignore']}));}catch{originals.set(path.resolve(repo,file).toLowerCase(),undefined);}}
const configPath=repo+'/packages/mcp/tsconfig.json';
const config=ts.readConfigFile(configPath,ts.sys.readFile);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,path.dirname(configPath),{noEmit:true},configPath);
function diagnostics(base){
  const host=ts.createCompilerHost(parsed.options);
  const read=host.readFile.bind(host),exists=host.fileExists.bind(host);
  if(base){host.readFile=p=>originals.has(path.resolve(p).toLowerCase())?originals.get(path.resolve(p).toLowerCase()):read(p);host.fileExists=p=>originals.has(path.resolve(p).toLowerCase())?originals.get(path.resolve(p).toLowerCase())!==undefined:exists(p);}
  const program=ts.createProgram(parsed.fileNames.filter(file => !base || host.fileExists(file)),parsed.options,host);
  return ts.getPreEmitDiagnostics(program).map(d=>({file:d.file?path.relative(repo,d.file.fileName).replaceAll('\\','/'):null,code:d.code,message:ts.flattenDiagnosticMessageText(d.messageText,'\n')}));
}
function difference(a,b){const counts=new Map();for(const v of b){const k=JSON.stringify(v);counts.set(k,(counts.get(k)||0)+1);}return a.filter(v=>{const k=JSON.stringify(v),n=counts.get(k)||0;if(n){counts.set(k,n-1);return false;}return true;});}
const base=diagnostics(true),current=diagnostics(false);
const removed=difference(base,current),added=difference(current,base);
const lint=n=>JSON.parse(fs.readFileSync(out+'/'+n+'-eslint.json','utf8')).flatMap(f=>f.messages.map(m=>({file:path.relative(repo,f.filePath).replaceAll('\\','/'),rule:m.ruleId,severity:m.severity,message:m.message})));
const lb=lint('baseline'),lc=lint('final');
const result={baseline,tsc:{baseline:base.length,current:current.length,added,removed},eslint:{baseline:lb.length,current:lc.length,added:difference(lc,lb),removed:difference(lb,lc)}};
fs.writeFileSync(out+'/differential.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
