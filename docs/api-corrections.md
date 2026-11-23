# API v2.1.0 — Important Constructor Signature

The `operatorType` parameter is the **SECOND positional argument** of the
constructor, NOT a property of the config object.

## ❌ Incorrect (silently ignored)

```js
const truslay = new TruslayUniversalClient({
  mode: 'collaboration',
  operatorType: 'agent', // ← This does NOT work
});
```

## ✅ Correct

```js
const truslay = new TruslayUniversalClient(
  { mode: 'collaboration', firewallMode: 'sandbox' },
  'agent', // ← Second positional argument
);
```

This applies to all operator types: `'human'`, `'agent'`, `'universal'`.

## Why it matters

The runtime reads the second constructor argument and defaults it to
`'universal'` when it is absent. An `operatorType` key inside the config object
is not read at all, so the client does not throw: it simply reports
`operator: universal` while the integrator believes it selected `agent`. Any
behaviour that depends on the operator — the scraping guard and the
behavioral guard for `'agent'` — is then silently not applied.

Verify it at startup rather than assuming it:

```js
const truslay = new TruslayUniversalClient(config, 'agent');
console.log(truslay.mode, truslay.operatorType); // collaboration agent
```

## Reference

- Verified on `@truslay/sdk@2.1.0` during the recorded integration run in
  [`demo-agente/`](../demo-agente/) — `mode=collaboration`, `operator=agent`,
  `status=sandbox`, five `ALLOW · sandbox_mode` verdicts.
