# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.0.0"></a>
# 1.0.0 (2018-11-11)

Almost a complete rewrite from the original project.
- Written in TypeScript.
- Make products modular.
  - Rewrite support for Elgato Stream Deck.
  - Add support for Elgato Stream Deck Mini.
- Make image module interchangable.
  - Allows for using any image library by wrapping it in an object implementing a specific interface.
  - Defaults to a wrapper of `sharp`. If no other library is specified and `sharp` isn't installed any image operation will throw an exception.
- Run HID operations in a separate thread or process when available.
  - Async HID operations enables image manipulation to be done in parallel with sending bytes over the wire.
  - Per default runs in a separate process by internally using [`fork`](https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options).
  - May be configured to use [`worker_threads`](https://nodejs.org/api/worker_threads.html) with `ArrayBuffer` transfer. However, this is not supported by `node-hid` at the moment.
  - Emulated async in single process is available and used as a final fallback by default if workers and processes fail, but should be avoided.
  - Ability to force future HID connections to use a specefic type of async mode by using `setHidAsyncType()`.

<a name="0.0.0"></a>
# [0.0.0](https://github.com/Lange/node-elgato-stream-deck/tree/dcdf311d21880540bd3bff8538bbb328f86c817e) (2018-04-26)

Branched the project from [https://github.com/Lange/node-elgato-stream-deck](https://github.com/Lange/node-elgato-stream-deck).
