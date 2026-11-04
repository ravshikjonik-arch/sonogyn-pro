# ADR-INF — Private inference alternatives

**Status:** Accepted · 2026-11-04

## Decision

- Keep in-app Gateway; Colibri optional sidecar.
- Choose **at most one** of vLLM / SGLang later by bake-off.
- Do not install Colibri+vLLM+SGLang together.

## Consequences

- LiteLLM deferred until Gateway covers all routes.
