# Interbit Test Harness Documentation

This document describes the Interbit Test Harness, a framework for
developing software (specifically a _covenant_) that interacts with
an Interbit blockchain.


## Requirements

1.  [Node.js](https://nodejs.org/), version 10.9, or higher.

2.  Expertise with Promises() and asynchronous software development.

3.  Familiarity with Blockchain concepts.

4.  Experience with the [React](https://reactjs.org/) and
    [Redux](https://redux.js.org/) frameworks.

5.  Expertise with [Redux-Saga](https://redux-saga.js.org/)


## Installation

Most development can be performed using the `interbit-test-harness` NPM
package:

```bash
npm i --save interbit-test-harness
```

If you prefer to develop within the Test Harness repo, follow these
steps:

1.  Clone the repo:

  ```bash
  git clone git@github.com:interbit/test-harness.git
  ```

2.  Enter the repo's folder:

  ```bash
  cd test-harness
  ```

  > Note: From now on, this folder is called the _repo root_.

3.  Install the dependencies:

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
* [Test Harness documentation](harness.md)
