# Diagnósticos ESLint R4-R4

Focal: 0 errores y 0 advertencias, código 0. Se confirmó la desaparición de preserve-caught-error en canonical-closure-service.ts:754 al preservar Error.cause.

## Salida global saneada

~~~text

packages/cli/src/__tests__/test-from-diff.test.ts
  6:1  warning  There should be no empty line within import group  import/order

packages/cli/src/commands.ts
  258:23  error  Unsafe argument of type `any` assigned to a parameter of type `PruneCommandOptions`  @typescript-eslint/no-unsafe-argument

packages/engine/src/__tests__/mocks/storage.mock.ts
  1:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any' or '@typescript-eslint/no-unsafe-return')

packages/knowledge/src/__tests__/candidate-generator.test.ts
  9:32  error  '_candidatesFile' is defined but never used  @typescript-eslint/no-unused-vars

packages/knowledge/src/__tests__/case-generator.test.ts
  1:1  warning  There should be at least one empty line between import groups  import/order

packages/knowledge/src/__tests__/lock-manager.test.ts
  3:1  warning  There should be at least one empty line between import groups  import/order
  4:1  warning  There should be at least one empty line between import groups  import/order

packages/knowledge/src/storage/lock-manager.ts
   2:1  warning  There should be at least one empty line between import groups   import/order
  56:7  error    There is no `cause` attached to the symptom error being thrown  preserve-caught-error
  63:5  error    Async method 'forceUnlock' has no 'await' expression            @typescript-eslint/require-await

packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts
  1:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any')
  1:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-argument')
  1:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-return')

packages/mcp/src/__tests__/p3-verification.test.ts
  1:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any')
  1:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-argument')
  1:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-return')

packages/mcp/src/__tests__/p4-3-1-b-block.test.ts
  1:1  warning  There should be at least one empty line between import groups          import/order
  1:1  warning  `vitest` import should occur after import of `node:path`               import/order
  5:1  warning  There should be at least one empty line between import groups          import/order
  7:1  warning  There should be at least one empty line between import groups          import/order
  8:1  warning  `../server.js` import should occur after import of `@qap/knowledge`    import/order
  9:1  warning  There should be at least one empty line between import groups          import/order
  9:1  warning  `../guidance.js` import should occur after import of `@qap/knowledge`  import/order

packages/mcp/src/__tests__/server.test.ts
  1:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-argument')
  1:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any')

packages/mcp/src/handlers/canonical-coverage-service.ts
  132:21  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  179:15  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  182:15  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  230:25  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  253:23  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion

packages/mcp/src/handlers/module-closure-store.ts
  129:77  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  130:86  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion

packages/playwright-runner/test/session-resolver.test.ts
  3:1  warning  There should be at least one empty line between import groups  import/order
  5:1  warning  There should be at least one empty line between import groups  import/order

packages/shared/src/__tests__/domain/canonical-coverage-invariants.test.ts
  1:1  warning  There should be at least one empty line between import groups  import/order

packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts
   15:1   warning  There should be at least one empty line between import groups                                 import/order
   41:3   error    'SENSITIVE_HTTP_HEADERS' is defined but never used                                            @typescript-eslint/no-unused-vars
   42:3   error    'SENSITIVE_CREDENTIAL_KEYS' is defined but never used                                         @typescript-eslint/no-unused-vars
  291:38  error    This assertion is unnecessary since the receiver accepts the original type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  292:38  error    This assertion is unnecessary since the receiver accepts the original type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  295:38  error    This assertion is unnecessary since the receiver accepts the original type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  296:38  error    This assertion is unnecessary since the receiver accepts the original type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  297:38  error    This assertion is unnecessary since the receiver accepts the original type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  298:38  error    This assertion is unnecessary since the receiver accepts the original type of the expression  @typescript-eslint/no-unnecessary-type-assertion

packages/shared/src/__tests__/domain/scenario-a-unknown-app.test.ts
  20:1  warning  There should be at least one empty line between import groups  import/order

packages/shared/src/__tests__/domain/scenario-b-new-module.test.ts
  21:1  warning  There should be at least one empty line between import groups  import/order
  24:3  error    'FlowScenario' is defined but never used                       @typescript-eslint/no-unused-vars

packages/shared/src/__tests__/domain/scenario-c-auth-and-cache.test.ts
   21:1   warning  There should be at least one empty line between import groups  import/order
  166:11  error    'archivedPasswordInput' is assigned a value but never used     @typescript-eslint/no-unused-vars

packages/shared/src/domain/contextual-dimensions.ts
  48:9   error  "dev" is overridden by string in this union type      @typescript-eslint/no-redundant-type-constituents
  48:17  error  "staging" is overridden by string in this union type  @typescript-eslint/no-redundant-type-constituents
  48:29  error  "prod" is overridden by string in this union type     @typescript-eslint/no-redundant-type-constituents

packages/shared/src/domain/invariants-validator.ts
   130:41  error  Unsafe argument of type `any` assigned to a parameter of type `"authorization" | "cookie" | "set-cookie" | "x-api-key" | "proxy-authorization"`                  @typescript-eslint/no-unsafe-argument
   130:53  error  Unexpected any. Specify a different type                                                                                                                         @typescript-eslint/no-explicit-any
   173:44  error  Unsafe argument of type `any` assigned to a parameter of type `"password" | "passwd" | "secret" | "token" | "raw_token" | "api_key" | "apikey" | "private_key"`  @typescript-eslint/no-unsafe-argument
   173:56  error  Unexpected any. Specify a different type                                                                                                                         @typescript-eslint/no-explicit-any
   179:45  error  Unsafe argument of type `any` assigned to a parameter of type `"authorization" | "cookie" | "set-cookie" | "x-api-key" | "proxy-authorization"`                  @typescript-eslint/no-unsafe-argument
   179:67  error  Unexpected any. Specify a different type                                                                                                                         @typescript-eslint/no-explicit-any
   203:45  error  Unsafe argument of type `any` assigned to a parameter of type `"authorization" | "cookie" | "set-cookie" | "x-api-key" | "proxy-authorization"`                  @typescript-eslint/no-unsafe-argument
   203:67  error  Unexpected any. Specify a different type                                                                                                                         @typescript-eslint/no-explicit-any
   265:28  error  This assertion is unnecessary since it does not change the type of the expression                                                                                @typescript-eslint/no-unnecessary-type-assertion
  1216:59  error  Unsafe argument of type `any` assigned to a parameter of type `object`                                                                                           @typescript-eslint/no-unsafe-argument

✖ 62 problems (34 errors, 28 warnings)
  14 errors and 28 warnings potentially fixable with the `--fix` option.

[ELIFECYCLE] Command failed with exit code 1.
~~~
