# ESLint R4-R12

Código 7ccf3db1a6f259f6a5c51521518bbb399a13fda2. Global **34 errores/28 advertencias**; foco ampliado siete archivos **7 errores/0 advertencias**. Exit1 sin --fix ni configuraciones/exclusiones/supresiones nuevas. Foco agrega module-closure-store.ts a los seis archivos R11; sus dos errores ya estaban en el global, no son altas R12.

Comparación literal archivo+línea+columna+nivel+regla+mensaje:56coincidencias y6altas/6bajas aparentes por líneas. Mapeo de diff y multiconjunto completo: **62/62 idénticos, cero altas/bajas reales**. Cinco aserciones Coverage+3:132→135,179→182,182→185,230→233,253→256; dos ClosureStore+8:129→137,130→138;55restantes sin desplazar. Coincidencia literal182 corresponde a otra aserción desplazada, no confundir posición con identidad física. R4-R8-L01 sigue ausente.

```json
{
  "errors": 34,
  "warnings": 28,
  "focusErrors": 7,
  "focusWarnings": 0,
  "identical": 56,
  "added": [
    {
      "file": "packages/mcp/src/handlers/canonical-coverage-service.ts",
      "line": 135,
      "column": 21,
      "severity": 2,
      "rule": "@typescript-eslint/no-unnecessary-type-assertion",
      "message": "This assertion is unnecessary since it does not change the type of the expression."
    },
    {
      "file": "packages/mcp/src/handlers/canonical-coverage-service.ts",
      "line": 185,
      "column": 15,
      "severity": 2,
      "rule": "@typescript-eslint/no-unnecessary-type-assertion",
      "message": "This assertion is unnecessary since it does not change the type of the expression."
    },
    {
      "file": "packages/mcp/src/handlers/canonical-coverage-service.ts",
      "line": 233,
      "column": 25,
      "severity": 2,
      "rule": "@typescript-eslint/no-unnecessary-type-assertion",
      "message": "This assertion is unnecessary since it does not change the type of the expression."
    },
    {
      "file": "packages/mcp/src/handlers/canonical-coverage-service.ts",
      "line": 256,
      "column": 23,
      "severity": 2,
      "rule": "@typescript-eslint/no-unnecessary-type-assertion",
      "message": "This assertion is unnecessary since it does not change the type of the expression."
    },
    {
      "file": "packages/mcp/src/handlers/module-closure-store.ts",
      "line": 137,
      "column": 77,
      "severity": 2,
      "rule": "@typescript-eslint/no-unnecessary-type-assertion",
      "message": "This assertion is unnecessary since it does not change the type of the expression."
    },
    {
      "file": "packages/mcp/src/handlers/module-closure-store.ts",
      "line": 138,
      "column": 86,
      "severity": 2,
      "rule": "@typescript-eslint/no-unnecessary-type-assertion",
      "message": "This assertion is unnecessary since it does not change the type of the expression."
    }
  ],
  "removed": [
    {
      "file": "packages/mcp/src/handlers/canonical-coverage-service.ts",
      "line": 132,
      "column": 21,
      "severity": 2,
      "rule": "@typescript-eslint/no-unnecessary-type-assertion",
      "message": "This assertion is unnecessary since it does not change the type of the expression."
    },
    {
      "file": "packages/mcp/src/handlers/canonical-coverage-service.ts",
      "line": 179,
      "column": 15,
      "severity": 2,
      "rule": "@typescript-eslint/no-unnecessary-type-assertion",
      "message": "This assertion is unnecessary since it does not change the type of the expression."
    },
    {
      "file": "packages/mcp/src/handlers/canonical-coverage-service.ts",
      "line": 230,
      "column": 25,
      "severity": 2,
      "rule": "@typescript-eslint/no-unnecessary-type-assertion",
      "message": "This assertion is unnecessary since it does not change the type of the expression."
    },
    {
      "file": "packages/mcp/src/handlers/canonical-coverage-service.ts",
      "line": 253,
      "column": 23,
      "severity": 2,
      "rule": "@typescript-eslint/no-unnecessary-type-assertion",
      "message": "This assertion is unnecessary since it does not change the type of the expression."
    },
    {
      "file": "packages/mcp/src/handlers/module-closure-store.ts",
      "line": 129,
      "column": 77,
      "severity": 2,
      "rule": "@typescript-eslint/no-unnecessary-type-assertion",
      "message": "This assertion is unnecessary since it does not change the type of the expression."
    },
    {
      "file": "packages/mcp/src/handlers/module-closure-store.ts",
      "line": 130,
      "column": 86,
      "severity": 2,
      "rule": "@typescript-eslint/no-unnecessary-type-assertion",
      "message": "This assertion is unnecessary since it does not change the type of the expression."
    }
  ],
  "semanticAdded": [],
  "semanticRemoved": [],
  "diffMappedIdentical": 62,
  "physicallyMoved": 7,
  "mapping": "Coverage +3 (5); ClosureStore +8 (2); restantes 55 sin desplazamiento"
}
```

## Diagnósticos íntegros

| Archivo | Línea:columna | Nivel | Regla | Mensaje |
| --- | --- | --- | --- | --- |
| packages/cli/src/__tests__/test-from-diff.test.ts | 6:1 | warning | import/order | There should be no empty line within import group |
| packages/cli/src/commands.ts | 258:23 | error | @typescript-eslint/no-unsafe-argument | Unsafe argument of type `any` assigned to a parameter of type `PruneCommandOptions`. |
| packages/engine/src/__tests__/mocks/storage.mock.ts | 1:1 | warning | unused-disable | Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any' or '@typescript-eslint/no-unsafe-return'). |
| packages/knowledge/src/__tests__/candidate-generator.test.ts | 9:32 | error | @typescript-eslint/no-unused-vars | '_candidatesFile' is defined but never used. |
| packages/knowledge/src/__tests__/case-generator.test.ts | 1:1 | warning | import/order | There should be at least one empty line between import groups |
| packages/knowledge/src/__tests__/lock-manager.test.ts | 3:1 | warning | import/order | There should be at least one empty line between import groups |
| packages/knowledge/src/__tests__/lock-manager.test.ts | 4:1 | warning | import/order | There should be at least one empty line between import groups |
| packages/knowledge/src/storage/lock-manager.ts | 2:1 | warning | import/order | There should be at least one empty line between import groups |
| packages/knowledge/src/storage/lock-manager.ts | 56:7 | error | preserve-caught-error | There is no `cause` attached to the symptom error being thrown. |
| packages/knowledge/src/storage/lock-manager.ts | 63:5 | error | @typescript-eslint/require-await | Async method 'forceUnlock' has no 'await' expression. |
| packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts | 1:1 | warning | unused-disable | Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any'). |
| packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts | 1:1 | warning | unused-disable | Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-argument'). |
| packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts | 1:1 | warning | unused-disable | Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-return'). |
| packages/mcp/src/__tests__/p3-verification.test.ts | 1:1 | warning | unused-disable | Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any'). |
| packages/mcp/src/__tests__/p3-verification.test.ts | 1:1 | warning | unused-disable | Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-argument'). |
| packages/mcp/src/__tests__/p3-verification.test.ts | 1:1 | warning | unused-disable | Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-return'). |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | 1:1 | warning | import/order | There should be at least one empty line between import groups |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | 1:1 | warning | import/order | `vitest` import should occur after import of `node:path` |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | 5:1 | warning | import/order | There should be at least one empty line between import groups |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | 7:1 | warning | import/order | There should be at least one empty line between import groups |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | 8:1 | warning | import/order | `../server.js` import should occur after import of `@qap/knowledge` |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | 9:1 | warning | import/order | There should be at least one empty line between import groups |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | 9:1 | warning | import/order | `../guidance.js` import should occur after import of `@qap/knowledge` |
| packages/mcp/src/__tests__/server.test.ts | 1:1 | warning | unused-disable | Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-argument'). |
| packages/mcp/src/__tests__/server.test.ts | 1:1 | warning | unused-disable | Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any'). |
| packages/mcp/src/handlers/canonical-coverage-service.ts | 135:21 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. |
| packages/mcp/src/handlers/canonical-coverage-service.ts | 182:15 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. |
| packages/mcp/src/handlers/canonical-coverage-service.ts | 185:15 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. |
| packages/mcp/src/handlers/canonical-coverage-service.ts | 233:25 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. |
| packages/mcp/src/handlers/canonical-coverage-service.ts | 256:23 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. |
| packages/mcp/src/handlers/module-closure-store.ts | 137:77 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. |
| packages/mcp/src/handlers/module-closure-store.ts | 138:86 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. |
| packages/playwright-runner/test/session-resolver.test.ts | 3:1 | warning | import/order | There should be at least one empty line between import groups |
| packages/playwright-runner/test/session-resolver.test.ts | 5:1 | warning | import/order | There should be at least one empty line between import groups |
| packages/shared/src/__tests__/domain/canonical-coverage-invariants.test.ts | 1:1 | warning | import/order | There should be at least one empty line between import groups |
| packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts | 15:1 | warning | import/order | There should be at least one empty line between import groups |
| packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts | 41:3 | error | @typescript-eslint/no-unused-vars | 'SENSITIVE_HTTP_HEADERS' is defined but never used. |
| packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts | 42:3 | error | @typescript-eslint/no-unused-vars | 'SENSITIVE_CREDENTIAL_KEYS' is defined but never used. |
| packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts | 291:38 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since the receiver accepts the original type of the expression. |
| packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts | 292:38 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since the receiver accepts the original type of the expression. |
| packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts | 295:38 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since the receiver accepts the original type of the expression. |
| packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts | 296:38 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since the receiver accepts the original type of the expression. |
| packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts | 297:38 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since the receiver accepts the original type of the expression. |
| packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts | 298:38 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since the receiver accepts the original type of the expression. |
| packages/shared/src/__tests__/domain/scenario-a-unknown-app.test.ts | 20:1 | warning | import/order | There should be at least one empty line between import groups |
| packages/shared/src/__tests__/domain/scenario-b-new-module.test.ts | 21:1 | warning | import/order | There should be at least one empty line between import groups |
| packages/shared/src/__tests__/domain/scenario-b-new-module.test.ts | 24:3 | error | @typescript-eslint/no-unused-vars | 'FlowScenario' is defined but never used. |
| packages/shared/src/__tests__/domain/scenario-c-auth-and-cache.test.ts | 21:1 | warning | import/order | There should be at least one empty line between import groups |
| packages/shared/src/__tests__/domain/scenario-c-auth-and-cache.test.ts | 166:11 | error | @typescript-eslint/no-unused-vars | 'archivedPasswordInput' is assigned a value but never used. |
| packages/shared/src/domain/contextual-dimensions.ts | 48:9 | error | @typescript-eslint/no-redundant-type-constituents | "dev" is overridden by string in this union type. |
| packages/shared/src/domain/contextual-dimensions.ts | 48:17 | error | @typescript-eslint/no-redundant-type-constituents | "staging" is overridden by string in this union type. |
| packages/shared/src/domain/contextual-dimensions.ts | 48:29 | error | @typescript-eslint/no-redundant-type-constituents | "prod" is overridden by string in this union type. |
| packages/shared/src/domain/invariants-validator.ts | 130:41 | error | @typescript-eslint/no-unsafe-argument | Unsafe argument of type `any` assigned to a parameter of type `"authorization" &#124; "cookie" &#124; "set-cookie" &#124; "x-api-key" &#124; "proxy-authorization"`. |
| packages/shared/src/domain/invariants-validator.ts | 130:53 | error | @typescript-eslint/no-explicit-any | Unexpected any. Specify a different type. |
| packages/shared/src/domain/invariants-validator.ts | 173:44 | error | @typescript-eslint/no-unsafe-argument | Unsafe argument of type `any` assigned to a parameter of type `"password" &#124; "passwd" &#124; "secret" &#124; "token" &#124; "raw_token" &#124; "api_key" &#124; "apikey" &#124; "private_key"`. |
| packages/shared/src/domain/invariants-validator.ts | 173:56 | error | @typescript-eslint/no-explicit-any | Unexpected any. Specify a different type. |
| packages/shared/src/domain/invariants-validator.ts | 179:45 | error | @typescript-eslint/no-unsafe-argument | Unsafe argument of type `any` assigned to a parameter of type `"authorization" &#124; "cookie" &#124; "set-cookie" &#124; "x-api-key" &#124; "proxy-authorization"`. |
| packages/shared/src/domain/invariants-validator.ts | 179:67 | error | @typescript-eslint/no-explicit-any | Unexpected any. Specify a different type. |
| packages/shared/src/domain/invariants-validator.ts | 203:45 | error | @typescript-eslint/no-unsafe-argument | Unsafe argument of type `any` assigned to a parameter of type `"authorization" &#124; "cookie" &#124; "set-cookie" &#124; "x-api-key" &#124; "proxy-authorization"`. |
| packages/shared/src/domain/invariants-validator.ts | 203:67 | error | @typescript-eslint/no-explicit-any | Unexpected any. Specify a different type. |
| packages/shared/src/domain/invariants-validator.ts | 265:28 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. |
| packages/shared/src/domain/invariants-validator.ts | 1216:59 | error | @typescript-eslint/no-unsafe-argument | Unsafe argument of type `any` assigned to a parameter of type `object`. |

## Comandos

```powershell
Run-Audit lint-focus @('exec','eslint','packages/engine/src/knowledge-store.port.ts','packages/knowledge/src/storage/file-storage.ts','packages/knowledge/src/storage/sqlite-knowledge-adapter.ts','packages/mcp/src/handlers/module-closure-store.ts','packages/mcp/src/handlers/canonical-closure-service.ts','packages/mcp/src/handlers/canonical-coverage-service.ts','packages/mcp/src/__tests__/canonical-coverage.test.ts','--format=json','--output-file=../r4-r12-evidence/lint-focus.json')
Run-Audit lint @('exec','eslint','.','--format=json','--output-file=../r4-r12-evidence/lint.json')
```


El resultado no es lint global verde; conserva exactamente la deuda previa.
