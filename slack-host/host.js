#!/usr/bin/env node

const VERSION = '1.0.1';
const { App } = require('@slack/bolt');
const path = require('path');
require('dotenv').config({ path: '/Users/hedachi/claude-code-slack-bot/.env' });

// Log to stderr (visible in Chrome)
console.error = console.error || function() {};
const log = (...args) => {
  const timestamp = new Date().toISOString();
  process.stderr.write(`[${timestamp}] [v${VERSION}] ${args.join(' ')}\n`);
};

log('Three Wise Men Slack Host starting...');

// Chrome拡張機能との通信用
let chromeExtension = null;

// Native Messagingの通信処理
function sendToChromeExtension(message) {
  if (!process.stdout.writable) return;
  
  const json = JSON.stringify(message);
  const length = Buffer.byteLength(json);
  const buffer = Buffer.allocUnsafe(4 + length);
  
  buffer.writeUInt32LE(length, 0);
  buffer.write(json, 4);
  
  process.stdout.write(buffer);
}

function readFromChromeExtension() {
  let buffer = Buffer.alloc(0);
  
  process.stdin.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    
    while (buffer.length >= 4) {
      const length = buffer.readUInt32LE(0);
      
      if (buffer.length >= 4 + length) {
        const json = buffer.slice(4, 4 + length).toString();
        try {
          const message = JSON.parse(json);
          handleChromeMessage(message);
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
        buffer = buffer.slice(4 + length);
      } else {
        break;
      }
    }
  });
}

function handleChromeMessage(message) {
  if (message.type === 'ping') {
    sendToChromeExtension({ type: 'pong' });
  } else if (message.type === 'ready') {
    sendToChromeExtension({ 
      type: 'status', 
      message: 'Slack connection established'
    });
  }
}

// Slack Appの初期化
log('Initializing Slack App...');
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});
log('Slack App initialized');

// /threewise コマンドの処理
app.command('/threewise', async ({ command, ack, say }) => {
  await ack();
  
  const question = command.text.trim();
  
  if (!question) {
    await say('質問を入力してください。使い方: `/threewise [質問]`');
    return;
  }
  
  // Chrome拡張機能に質問を送信
  sendToChromeExtension({
    type: 'question',
    text: question,
    user: command.user_name,
    channel: command.channel_name,
    timestamp: new Date().toISOString()
  });
  
  await say(`🤖 Three Wise Menに質問を送信しました:\n> ${question}`);
});

// ダイレクトメッセージの処理（DM内で@three-wise-menまたは特定のキーワード）
app.message(/^threewise:(.+)/i, async ({ message, say }) => {
  const question = message.text.replace(/^threewise:/i, '').trim();
  
  if (!question) return;
  
  // Chrome拡張機能に質問を送信
  sendToChromeExtension({
    type: 'question',
    text: question,
    user: message.user,
    channel: message.channel,
    timestamp: new Date().toISOString()
  });
  
  await say(`🤖 Three Wise Menに質問を送信しました:\n> ${question}`);
});

// メンションされた時の処理
app.event('app_mention', async ({ event, say }) => {
  const question = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
  
  if (!question) {
    await say('質問を入力してください。');
    return;
  }
  
  // Chrome拡張機能に質問を送信
  sendToChromeExtension({
    type: 'question',
    text: question,
    user: event.user,
    channel: event.channel,
    timestamp: new Date().toISOString()
  });
  
  await say(`🤖 Three Wise Menに質問を送信しました:\n> ${question}`);
});

// アプリの起動
(async () => {
  try {
    log('Starting Native Messaging listener...');
    // Native Messagingの通信を開始
    readFromChromeExtension();
    
    log('Starting Slack App...');
    // Slack Appを起動
    await app.start();
    
    log('Slack App started successfully');
    
    // 起動完了を通知
    sendToChromeExtension({
      type: 'connected',
      message: 'Slack bot connected successfully',
      version: VERSION
    });
    
    log('⚡️ Three Wise Men Slack host is running!');
  } catch (error) {
    log('Error starting app:', error.message);
    log('Stack trace:', error.stack);
    process.exit(1);
  }
})();

// エラーハンドリング
process.on('uncaughtException', (error) => {
  log('Uncaught Exception:', error.message);
  sendToChromeExtension({
    type: 'error',
    message: error.message
  });
});

process.on('unhandledRejection', (reason, promise) => {
  log('Unhandled Rejection:', reason);
});

// Debug stdin/stdout status
log('stdin readable:', process.stdin.readable);
log('stdout writable:', process.stdout.writable);