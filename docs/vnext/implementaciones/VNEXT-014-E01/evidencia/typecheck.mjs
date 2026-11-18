import ts from '../../../../../node_modules/typescript/lib/typescript.js';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import console from 'node:console';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const directory=dirname(fileURLToPath(import.meta.url)), root=resolve(directory,'../../../../..');
const reference='26143382d1262b2ef9cbeb02f8773148e4439ebc';
const config=ts.readConfigFile(resolve(root,'packages/mcp/tsconfig.json'),ts.sys.readFile);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,resolve(root,'packages/mcp'),{noEmit:true},resolve(root,'packages/mcp/tsconfig.json'));
const changed=execFileSync('git',['diff','--name-only',reference,'--','packages/mcp'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>f.endsWith('.ts'));
const oldFiles=new Map(changed.map(file=>{
  let original;
  try { original=execFileSync('git',['show',reference+':'+file],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}); } catch { /* New diagnostic/test file did not exist at baseline. */ }
  return [resolve(root,file).toLowerCase(),original];
}));
function check(before) {
  const host=ts.createCompilerHost({...parsed.options,noEmit:true});
  if(before) {
    const read=host.readFile.bind(host),exists=host.fileExists.bind(host);
    host.readFile=file=>oldFiles.has(resolve(file).toLowerCase())?oldFiles.get(resolve(file).toLowerCase()):read(file);
    host.fileExists=file=>oldFiles.has(resolve(file).toLowerCase())?oldFiles.get(resolve(file).toLowerCase())!==undefined:exists(file);
  }
  const program=ts.createProgram(parsed.fileNames.filter(file=>!before||host.fileExists(file)),{...parsed.options,noEmit:true},host);
  return ts.getPreEmitDiagnostics(program).map(d=>({file:d.file?.fileName.replaceAll('\\','/').replace(root.replaceAll('\\','/')+'/',''),code:d.code,message:ts.flattenDiagnosticMessageText(d.messageText,'\n')}));
}
const before=check(true),after=check(false), key=d=>JSON.stringify(d);
const b=new Set(before.map(key)),a=new Set(after.map(key));
const result={reference,baseline:before.length,final:after.length,added:after.filter(d=>!b.has(key(d))),removed:before.filter(d=>!a.has(key(d)))};
writeFileSync(resolve(directory,'typecheck.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
