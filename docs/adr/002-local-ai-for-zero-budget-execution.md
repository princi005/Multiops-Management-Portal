\# ADR 002: Local AI (Ollama) for Zero-Budget 12-Week Execution



\## Status

Proposed (not yet implemented — relevant starting Week 8)



\## Context

The original architecture listed the Anthropic API for the AI Knowledge

Assistant and engineering-intelligence features. The Anthropic API has

no permanent free tier. The 12-week execution target was set at $0.



\## Decision

Use a locally-run open-source model via Ollama for AI features during

the zero-budget execution window, behind a swappable provider

abstraction (one `ai\_service.py` file), so switching to a paid API

later is a config change, not a rewrite.



\## Reasoning

\- Original requirements (Section 6/7) explicitly permitted Ollama as a

&#x20; free/local AI option.

\- Keeps the $0 constraint intact through all 12 weeks without reducing

&#x20; the AI features' architecture or scope.



\## Consequences

\- Lower answer quality/speed than Claude, acceptable trade for a

&#x20; learning/prototype project demonstrating RAG architecture.

\- Requires local machine RAM sufficient to run the chosen model

&#x20; (8GB minimum, 16GB comfortable) — a small spike test recommended

&#x20; before building the full AI Knowledge Assistant UI around it.



## Current product boundary (2026-11-26)

The current AI Assistant is a frontend placeholder. No model calls, Ollama integration, RAG, or inference workflow is part of the implemented product. The proposal above remains a historical/proposed architecture decision and must not be described as an active integration.