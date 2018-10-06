# Glossary

* <a name="action"></a>**Action**

  An command, or instruction, that should be processed to modify the
  current state of a blockchain.


* <a name="action_pool"></a>**Action Pool**

  A buffer of actions that are flowing into the hypervisor. The buffer
  should be self-blocking: actions should be processed sequentially.


* <a name="async_object"></a>**Async Object**

  Async Object worker is an object with knowledge of how to interact
  with a hardware to accomplish an async/side-effect operation. At each
  moment in time, there might be many instances of a worker each
  accomplishing some task on behalf of the saga.


* <a name="covenant"></a>**Covenant**

  A javascript object describing the code and configuration that manages
  the evolution of a [state](#state). See [Covenant](covenant.md) for
  details.


* <a name="reducer"></a>**Reducer**

  A reducer, or smart contract, provides the business logic for
  responding to actions. The smart contract defines all of the commands,
  or instructions, that can modify a blockchain's state.


* <a name="state"></a>**State**

  A state is a key->value dictionary, stored on a blockchain, with an
  arbitrary initial definition. Since blocks on a blockchain are
  immutable, the state can only be modified via the [reducer](#reducer).


* <a name="side_effects"></a>**Side effects**

  A side effect is any observable effect outside of the state. See [Side
  effects](side_effects.md) for details.


* <a name="singleton_context"></a>**Singleton Context**

  Singleton context is an object responsible for managing a resources
  shared with different [Async Object](#async-object) workers. It is
  often used to cache information or handles to hardware resources.
