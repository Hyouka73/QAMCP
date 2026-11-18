# ESLint R4-R11

Código 4bb22547349a407b1eeb2383e6981af5dd1db07a. **Global 34 errores / 28 advertencias; focal ampliado 5 errores / 0 advertencias.** Ambos salida1, sin --fix. Comparación estricta con R10 por archivo/línea/columna/severidad/regla/mensaje: **62 idénticos, cero altas, cero bajas**. No se ocultaron históricos ni se modificaron configuración, supresiones o exclusiones. R4-R8-L01 sigue ausente. El comentario require-await del adapter es anterior a esta ronda.

Foco de seis archivos: engine/src/knowledge-store.port.ts; knowledge/src/storage/file-storage.ts y sqlite-knowledge-adapter.ts; mcp/src/handlers/canonical-closure-service.ts y canonical-coverage-service.ts; mcp/src/__tests__/canonical-coverage.test.ts. Cinco errores históricos no-unnecessary-type-assertion en coverage-service132:21,179:15,182:15,230:25,253:23. Los dos fuentes modificados R11 y la nueva prueba no agregan diagnóstico.

```json
{
  "errors": 34,
  "warnings": 28,
  "focusErrors": 5,
  "focusWarnings": 0,
  "identical": 62,
  "added": [],
  "removed": []
}
```

## Inventario global íntegro

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
| packages/mcp/src/handlers/canonical-coverage-service.ts | 132:21 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. |
| packages/mcp/src/handlers/canonical-coverage-service.ts | 179:15 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. |
| packages/mcp/src/handlers/canonical-coverage-service.ts | 182:15 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. |
| packages/mcp/src/handlers/canonical-coverage-service.ts | 230:25 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. |
| packages/mcp/src/handlers/canonical-coverage-service.ts | 253:23 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. |
| packages/mcp/src/handlers/module-closure-store.ts | 129:77 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. |
| packages/mcp/src/handlers/module-closure-store.ts | 130:86 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. |
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

Arneses externos fuera del repositorio y bundles bajo node_modules ya excluido por configuración previa. No se agregó ninguna exclusión. [Comandos y hashes](COMANDOS.md).
