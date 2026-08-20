// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// This machine's libuv/worker_threads hits a fatal hang whenever
// MessagePort is used (react-dom's scheduler uses MessageChannel when the
// test DOM environment provides one). Deleting it forces the scheduler's
// setTimeout fallback instead, sidestepping the OS-level bug.
delete globalThis.MessageChannel;
