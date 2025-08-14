#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// Chrome拡張機能のマニフェストから拡張機能IDを推定
// 実際のIDはChrome拡張機能をインストール後に取得する必要がある
const EXTENSION_ID = process.argv[2] || 'YOUR_EXTENSION_ID';

// Native Messagingホストのマニフェスト
const hostManifest = {
  name: "com.threewisemen.slack",
  description: "Three Wise Men Slack Integration",
  path: path.join(__dirname, 'host.js'),
  type: "stdio",
  allowed_origins: [
    `chrome-extension://${EXTENSION_ID}/`
  ]
};

// インストール先のディレクトリ
const getNativeMessagingDirectory = () => {
  const platform = os.platform();
  const home = os.homedir();
  
  switch (platform) {
    case 'darwin': // macOS
      return path.join(home, 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts');
    case 'linux':
      return path.join(home, '.config', 'google-chrome', 'NativeMessagingHosts');
    case 'win32':
      // Windowsの場合はレジストリ設定が必要
      throw new Error('Windows installation requires registry modification. Please install manually.');
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
};

// インストール処理
const install = () => {
  try {
    if (EXTENSION_ID === 'YOUR_EXTENSION_ID') {
      console.log('⚠️  警告: Chrome拡張機能のIDを指定してください');
      console.log('使用方法: npm run install-host -- <EXTENSION_ID>');
      console.log('\n拡張機能IDの確認方法:');
      console.log('1. Chrome拡張機能を開発者モードでインストール');
      console.log('2. chrome://extensions/ を開く');
      console.log('3. "Three Wise Men"拡張機能のIDをコピー');
      console.log('4. npm run install-host -- <コピーしたID> を実行');
      return;
    }
    
    const nativeDir = getNativeMessagingDirectory();
    
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(nativeDir)) {
      fs.mkdirSync(nativeDir, { recursive: true });
      console.log(`✅ Created directory: ${nativeDir}`);
    }
    
    // マニフェストファイルを書き込み
    const manifestPath = path.join(nativeDir, 'com.threewisemen.slack.json');
    fs.writeFileSync(manifestPath, JSON.stringify(hostManifest, null, 2));
    
    console.log('✅ Native Messaging Host installed successfully!');
    console.log(`   Manifest: ${manifestPath}`);
    console.log(`   Extension ID: ${EXTENSION_ID}`);
    console.log('\n次の手順:');
    console.log('1. npm install を実行して依存関係をインストール');
    console.log('2. Chrome拡張機能を再読み込み');
    console.log('3. npm start でホストアプリを起動');
    
  } catch (error) {
    console.error('❌ Installation failed:', error.message);
    process.exit(1);
  }
};

// アンインストール処理
const uninstall = () => {
  try {
    const nativeDir = getNativeMessagingDirectory();
    const manifestPath = path.join(nativeDir, 'com.threewisemen.slack.json');
    
    if (fs.existsSync(manifestPath)) {
      fs.unlinkSync(manifestPath);
      console.log('✅ Native Messaging Host uninstalled successfully!');
    } else {
      console.log('⚠️  Native Messaging Host is not installed.');
    }
  } catch (error) {
    console.error('❌ Uninstallation failed:', error.message);
    process.exit(1);
  }
};

// コマンドライン引数を確認
const command = process.argv[3];
if (command === 'uninstall') {
  uninstall();
} else {
  install();
}