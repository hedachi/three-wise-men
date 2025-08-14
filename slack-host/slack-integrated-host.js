#!/usr/bin/env node

const VERSION = '1.1.0';
const fs = require('fs');
const { App } = require('@slack/bolt');
require('dotenv').config({ path: '/Users/hedachi/claude-code-slack-bot/.env' });

// Log to file for debugging
const logFile = '/tmp/three-wise-men-host.log';
const log = (msg) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] [v${VERSION}] ${msg}\n`);
};

log('Slack-integrated host starting...');

// Native Messaging protocol
function sendMessage(message) {
  const json = JSON.stringify(message);
  const length = Buffer.byteLength(json);
  const buffer = Buffer.allocUnsafe(4 + length);
  
  buffer.writeUInt32LE(length, 0);
  buffer.write(json, 4);
  
  process.stdout.write(buffer);
  log(`Sent to Chrome: ${json}`);
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
          log(`Received from Chrome: ${json}`);
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
      message: 'Slack integration ready',
      version: VERSION
    });
  } else if (message.type === 'response') {
    log(`Response from Chrome: ${message.message}`);
  }
}

// Slack App initialization
let slackApp = null;

async function initSlack() {
  try {
    log('Initializing Slack App...');
    log(`SLACK_BOT_TOKEN: ${process.env.SLACK_BOT_TOKEN ? 'Set' : 'Not set'}`);
    log(`SLACK_APP_TOKEN: ${process.env.SLACK_APP_TOKEN ? 'Set' : 'Not set'}`);
    
    if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_APP_TOKEN) {
      throw new Error('Missing Slack tokens in environment');
    }
    
    slackApp = new App({
      token: process.env.SLACK_BOT_TOKEN,
      appToken: process.env.SLACK_APP_TOKEN,
      socketMode: true,
      // Prevent Slack from interfering with stdio
      logLevel: 'error',
    });
    
    // /threewise command handler
    slackApp.command('/threewise', async ({ command, ack, say }) => {
      await ack();
      
      const question = command.text.trim();
      log(`Received /threewise command: ${question}`);
      
      if (!question) {
        await say('質問を入力してください。使い方: `/threewise [質問]`');
        return;
      }
      
      // Send to Chrome extension
      sendMessage({
        type: 'question',
        text: question,
        user: command.user_name,
        channel: command.channel_name,
        timestamp: new Date().toISOString()
      });
      
      await say(`🤖 Three Wise Menに質問を送信しました:\n> ${question}`);
    });
    
    // Message handler for "threewise:" prefix
    slackApp.message(/^threewise:(.+)/i, async ({ message, say }) => {
      const question = message.text.replace(/^threewise:/i, '').trim();
      log(`Received threewise: message: ${question}`);
      
      if (!question) return;
      
      sendMessage({
        type: 'question',
        text: question,
        user: message.user,
        channel: message.channel,
        timestamp: new Date().toISOString()
      });
      
      await say(`🤖 Three Wise Menに質問を送信しました:\n> ${question}`);
    });
    
    // App mention handler
    slackApp.event('app_mention', async ({ event, say }) => {
      const question = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
      log(`Received app mention: ${question}`);
      
      if (!question) {
        await say('質問を入力してください。');
        return;
      }
      
      sendMessage({
        type: 'question',
        text: question,
        user: event.user,
        channel: event.channel,
        timestamp: new Date().toISOString()
      });
      
      await say(`🤖 Three Wise Menに質問を送信しました:\n> ${question}`);
    });
    
    // Start Slack app
    await slackApp.start();
    log('Slack App started successfully');
    
    sendMessage({
      type: 'connected',
      message: 'Slack bot connected successfully',
      version: VERSION
    });
    
  } catch (error) {
    log(`Error initializing Slack: ${error.message}`);
    sendMessage({
      type: 'error',
      message: `Slack initialization failed: ${error.message}`,
      version: VERSION
    });
  }
}

// Error handlers
process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`);
  log(`Stack: ${error.stack}`);
});

process.on('unhandledRejection', (reason) => {
  log(`Unhandled Rejection: ${reason}`);
});

// Protect stdio from being closed
process.stdin.on('error', (error) => {
  log(`stdin error: ${error.message}`);
});

process.stdout.on('error', (error) => {
  log(`stdout error: ${error.message}`);
});

// Start everything
log('Setting up message reader...');
readMessages();

// Initialize Slack after a short delay
setTimeout(() => {
  initSlack().catch(error => {
    log(`Failed to initialize Slack: ${error.message}`);
    log(`Stack: ${error.stack}`);
    sendMessage({
      type: 'error',
      message: `Slack initialization failed: ${error.message}`,
      version: VERSION
    });
  });
}, 1000);

// Send initial message
sendMessage({
  type: 'connected',
  message: 'Host connected, initializing Slack...',
  version: VERSION
});

log('Slack-integrated host ready');