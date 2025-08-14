#!/usr/bin/env node

// Simple test for Native Messaging
process.stdin.on('data', (chunk) => {
  // Log received data
  process.stderr.write(`Received: ${chunk.toString('hex')}\n`);
});

// Send a test message back
const message = { type: 'test', message: 'Hello from test host' };
const json = JSON.stringify(message);
const length = Buffer.byteLength(json);
const buffer = Buffer.allocUnsafe(4 + length);

buffer.writeUInt32LE(length, 0);
buffer.write(json, 4);

process.stdout.write(buffer);
process.stderr.write('Test message sent\n');

// Keep process alive
setInterval(() => {}, 1000);