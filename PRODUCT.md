# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Modern stable Angular and TypeScript, a candidate-written WebAssembly generator,
a Web Worker, and unit tests. The user chose direct implementation in Angular.

## Users

Experienced engineers reviewing a senior frontend take-home assignment. The
candidate must be able to explain and modify the implementation during an interview.

## Product Purpose

A small realtime dashboard for fictional financial instruments. Success means
correct cumulative metrics, responsive controls, clear state, and readable code.

## Operating Context

Reviewers open the dashboard, pause and resume generation, navigate to settings,
apply a new run, and increase the generation rate. No real trades or market data.

## Capabilities and Constraints

Two pages: market dashboard and producer settings. Five metrics per instrument:
last price, spread, cumulative volume, cumulative VWAP, and book imbalance.
Defaults: 5 instruments, 100 updates per batch, 500 ms interval. Applying settings
starts a new run. Navigation preserves the single producer. Wasm must generate
stateful market updates in a worker. No complete event history may be retained.
Required tests cover calculations, validation, lifecycle races, and the compiled
generator. The user will create the remote repository and handle deployment.

## Evidence on Hand

The supplied assignment defines all formulas and acceptance criteria. The role
emphasizes real-time UI performance, automated tests, and code quality. No brand
assets, production data, or performance benchmark claims were supplied.

## Product Principles

- Make correctness and run state easy to inspect.
- Keep work proportional to instrument count, not accumulated history.
- Prefer platform and Angular features to extra frameworks.
- Make the build, tests, and architectural tradeoffs easy to explain.
