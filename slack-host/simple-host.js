#!/usr/bin/env node

const VERSION = '1.0.2';
const fs = require('fs');

// Log to file for debugging
const logFile = '/tmp/three-wise-men-host.log';
const log = (msg) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] [v${VERSION}] ${msg}\n`);
};

log('Simple host starting...');

// Native Messaging protocol
function sendMessage(message) {
  const json = JSON.stringify(message);
  const length = Buffer.byteLength(json);
  const buffer = Buffer.allocUnsafe(4 + length);
  
  buffer.writeUInt32LE(length, 0);
  buffer.write(json, 4);
  
  process.stdout.write(buffer);
  log(`Sent message: ${json}`);
}

function readMessages() {
  let buffer = Buffer.alloc(0);
  
  process.stdin.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    
    while (buffer.length >= 4) {
      const length = buffer.readUInt32LE(0);
      
      if (buffer.length >= 4 + length) {
        const json = buffer.slice(4, 4 + length).toString();
        try {
          const message = JSON.parse(json);
          log(`Received message: ${json}`);
          handleMessage(message);
        } catch (e) {
          log(`Failed to parse message: ${e.message}`);
        }
        buffer = buffer.slice(4 + length);
      } else {
        break;
      }
    }
  });
  
  process.stdin.on('end', () => {
    log('stdin ended');
    process.exit(0);
  });
}

function handleMessage(message) {
  log(`Handling message type: ${message.type}`);
  
  if (message.type === 'ping') {
    sendMessage({ type: 'pong', version: VERSION });
  } else if (message.type === 'ready') {
    sendMessage({ 
      type: 'status', 
      message: 'Simple host ready',
      version: VERSION
    });
  }
}

// Start
log('Setting up message reader...');
readMessages();

// Send initial message
sendMessage({
  type: 'connected',
  message: 'Simple host connected',
  version: VERSION
});

log('Simple host ready');