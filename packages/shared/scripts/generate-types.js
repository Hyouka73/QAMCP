import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'json-schema-to-typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEMAS_DIR = path.resolve(__dirname, '../schemas');
const TYPES_DIR = path.resolve(__dirname, '../src/types');

const SCHEMA_TYPE_MAP = [
  {
    schema: 'project-init.schema.json',
    typeFile: 'project-init.type.ts',
    rootType: 'ProjectInit',
    extras: '',
  },
  {
    schema: 'environments.schema.json',
    typeFile: 'environments.type.ts',
    rootType: 'Environments',
    extras: `\nexport interface EnvironmentConfig {\n  url: string;\n  browser_mode?: 'auto' | 'headless' | 'headed';\n}\n`,
  },
  {
    schema: 'auth-profiles.schema.json',
    typeFile: 'auth-profiles.type.ts',
    rootType: 'AuthProfiles',
    extras: `\nexport type AuthProfile = AuthProfiles['profiles'][number];\nexport type PostLoginCondition = NonNullable<AuthProfile['post_login_condition']>;\n`,
  },
  {
    schema: 'module-context.schema.json',
    typeFile: 'module-context.type.ts',
    rootType: 'ModuleContext',
    extras: '',
  },
  {
    schema: 'prereqs.schema.json',
    typeFile: 'prereqs.type.ts',
    rootType: 'Prereqs',
    extras: `\nexport type Requirements = Prereqs['requires'];\nexport type AuthRequirements = Requirements['auth'];\nexport type StatePrerequisite = NonNullable<Requirements['state']>[number];\nexport type Teardown = NonNullable<Prereqs['teardown']>;\n`,
  },
  {
    schema: 'execution-result.schema.json',
    typeFile: 'execution-result.type.ts',
    rootType: 'ExecutionResult',
    extras: `\nexport type ExecutionStep = NonNullable<ExecutionResult['steps']>[number];\nexport type Timestamps = ExecutionResult['timestamps'];\nexport type Screenshot = NonNullable<ExecutionResult['screenshots']>[number];\n`,
  },
  {
    schema: 'rules.schema.json',
    typeFile: 'rules.type.ts',
    rootType: 'Rules',
    extras: `\nexport type Rule = NonNullable<Rules['rules']>[number];\n`,
  },
  {
    schema: 'module-flows.schema.json',
    typeFile: 'module-flows.type.ts',
    rootType: 'ModuleFlows',
    extras: `\nexport type FlowItem = NonNullable<ModuleFlows['flows']>[number];\n`,
  },
  {
    schema: 'flow.schema.json',
    typeFile: 'flow.type.ts',
    rootType: 'Flow',
    extras: `\nexport type FlowModule = Flow['modules'][number];\nexport type ContextSharing = NonNullable<Flow['context_sharing']>[number];\nexport type FlowTeardown = NonNullable<Flow['teardown']>;\nexport type TeardownAction = NonNullable<NonNullable<Flow['teardown']>['on_failure']>[number];\n`,
  },
  {
    schema: 'tc-case.schema.json',
    typeFile: 'tc-case.type.ts',
    rootType: 'TCCase',
    extras: `\nexport type TCStep = TCCase['steps'][number];\nexport type TCStepType = TCStep['type'];\nexport type AssertionType = 'element_present' | 'element_text' | 'url_match' | 'js_expression';\nexport type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';\nexport type InterceptConfig = NonNullable<TCStep['intercept_config']>;\n`,
  },
  {
    schema: 'selectors.schema.json',
    typeFile: 'selectors.type.ts',
    rootType: 'Selectors',
    extras: `\nexport type SelectorsMetadata = Selectors['metadata'];\n`,
  },
  {
    schema: 'semantic-hash.schema.json',
    typeFile: 'semantic-hash.type.ts',
    rootType: 'SemanticHash',
    extras: '',
  },
  {
    schema: 'system-prompt.schema.json',
    typeFile: 'system-prompt.type.ts',
    rootType: 'SystemPrompt',
    extras: `\nexport type DefaultWorkflows = NonNullable<SystemPrompt['default_workflows']>;\n`,
  },
];

async function generateTypes() {
  console.log('🔄 Compilando JSON Schemas desde packages/shared/schemas/ con json-schema-to-typescript...');

  if (!fs.existsSync(TYPES_DIR)) {
    fs.mkdirSync(TYPES_DIR, { recursive: true });
  }

  for (const entry of SCHEMA_TYPE_MAP) {
    const schemaPath = path.join(SCHEMAS_DIR, entry.schema);
    if (!fs.existsSync(schemaPath)) {
      console.warn(`⚠ Schema no encontrado: ${schemaPath}`);
      continue;
    }

    const rawSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    const schemaWithTitle = { ...rawSchema, title: entry.rootType };

    const tsOutput = await compile(schemaWithTitle, entry.rootType, {
      bannerComment: `/**\n * Archivo generado automaticamente a partir de ${entry.schema}\n * No editar manualmente este archivo.\n */`,
    });

    const finalOutput = `${tsOutput}${entry.extras}`;
    const outputPath = path.join(TYPES_DIR, entry.typeFile);

    fs.writeFileSync(outputPath, finalOutput, 'utf-8');
    console.log(` ✅ Generado: ${entry.typeFile} a partir de ${entry.schema}`);
  }

  console.log('✨ Todos los tipos TypeScript fueron compilados exitosamente.');
}

generateTypes().catch((err) => {
  console.error('❌ Error generando tipos TypeScript:', err);
  process.exit(1);
});
