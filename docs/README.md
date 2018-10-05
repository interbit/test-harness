# Interbit Test Harness Documentation

This document describes the Interbit Test Harness, a framework for
developing software (specifically a _covenant_) that interacts with
an Interbit blockchain.


## Requirements

1.  [Node.js](https://nodejs.org/), version 8.x, or higher.
1.  Expertise with Promises() and asynchronous software development.
1.  Familiarity with Blockchain concepts.
1.  Experience with the [React](https://reactjs.org/) and
    [Redux](https://redux.js.org/) frameworks.
1.  Expertise with [Redux-Saga](https://redux-saga.js.org/)


## Installation

1.  Clone the repo:

  ```bash
  git clone git@github.com:BlockchainTechLtd/interbit-harness-external.git
  ```

1.  Enter the repo's folder:

  ```bash
  cd interbit-harness-external
  ```

  > Note: From now on, this folder is called the _repo root_.

1.  Install the dependencies:

    ```bash
    npm i
    ```


## Run

*   Invoke the tests:

    ```bash
    npm run test
    ```

*   Invoke the tests, with a watcher (automatically re-runs tests on
    code updates in the current directory):

    ```bash
    npm run test:watch
    ```


## Additional documentation

* [Covenant](covenant.md)
* [Glossary](glossary.md)
* [Side effects](side_effects.md)
