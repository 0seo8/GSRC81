/**
 * PWA 아이콘 및 스플래시 이미지 생성 스크립트
 *
 * 생성되는 파일:
 * - icon-192x192.png: PWA 아이콘 (manifest.json용)
 * - icon-512x512.png: PWA 아이콘 (manifest.json용, 스플래시용)
 * - apple-icon-180x180.png: iOS 홈 화면 아이콘
 * - apple-splash-*.png: iOS 스플래시 이미지 (다양한 해상도)
 */

import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const logoPath = join(publicDir, 'logo.png');

// 브랜드 컬러 (manifest.json background_color와 동일)
const BACKGROUND_COLOR = { r: 248, g: 249, b: 250 }; // #f8f9fa
const BRAND_COLOR = { r: 0, g: 0, b: 0 }; // #000000 (theme_color)

// PWA 아이콘 사이즈
const ICON_SIZES = [192, 512];

// iOS 스플래시 이미지 사이즈 (디바이스별)
const SPLASH_SIZES = [
  { width: 1170, height: 2532, name: 'iphone-12-pro' },     // iPhone 12/13/14 Pro
  { width: 1284, height: 2778, name: 'iphone-12-pro-max' }, // iPhone 12/13/14 Pro Max
  { width: 1179, height: 2556, name: 'iphone-14-pro' },     // iPhone 14 Pro
  { width: 1290, height: 2796, name: 'iphone-14-pro-max' }, // iPhone 14 Pro Max
  { width: 750, height: 1334, name: 'iphone-8' },           // iPhone 8/SE
  { width: 1125, height: 2436, name: 'iphone-x' },          // iPhone X/XS/11 Pro
  { width: 1242, height: 2688, name: 'iphone-xs-max' },     // iPhone XS Max/11 Pro Max
  { width: 828, height: 1792, name: 'iphone-xr' },          // iPhone XR/11
  { width: 1536, height: 2048, name: 'ipad' },              // iPad
  { width: 2048, height: 2732, name: 'ipad-pro' },          // iPad Pro 12.9
];

async function generateIcon(size) {
  const logo = await sharp(logoPath);
  const metadata = await logo.metadata();

  // 로고를 정사각형에 맞게 리사이즈 (패딩 포함)
  const logoSize = Math.floor(size * 0.65); // 로고가 아이콘의 65% 차지

  // 로고 리사이즈 (비율 유지)
  const resizedLogo = await sharp(logoPath)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  // 배경 이미지 생성 후 로고 합성
  const icon = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { ...BACKGROUND_COLOR, alpha: 1 }
    }
  })
    .composite([{
      input: resizedLogo,
      gravity: 'center'
    }])
    .png()
    .toFile(join(publicDir, `icon-${size}x${size}.png`));

  console.log(`✓ Generated icon-${size}x${size}.png`);
}

async function generateAppleIcon() {
  const size = 180;
  const logoSize = Math.floor(size * 0.65);

  const resizedLogo = await sharp(logoPath)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { ...BACKGROUND_COLOR, alpha: 1 }
    }
  })
    .composite([{
      input: resizedLogo,
      gravity: 'center'
    }])
    .png()
    .toFile(join(publicDir, 'apple-icon-180x180.png'));

  console.log('✓ Generated apple-icon-180x180.png');
}

async function generateSplashScreen({ width, height, name }) {
  // 로고 사이즈 계산 (화면 너비의 60%)
  const logoWidth = Math.floor(width * 0.6);
  const logoHeight = Math.floor(logoWidth * 0.63); // 로고 비율 유지 (374/592 ≈ 0.63)

  const resizedLogo = await sharp(logoPath)
    .resize(logoWidth, logoHeight, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { ...BACKGROUND_COLOR, alpha: 1 }
    }
  })
    .composite([{
      input: resizedLogo,
      gravity: 'center'
    }])
    .png()
    .toFile(join(publicDir, `apple-splash-${width}x${height}.png`));

  console.log(`✓ Generated apple-splash-${width}x${height}.png (${name})`);
}

async function main() {
  console.log('🎨 Generating PWA assets...\n');

  try {
    // PWA 아이콘 생성
    console.log('📱 Generating PWA icons...');
    for (const size of ICON_SIZES) {
      await generateIcon(size);
    }

    // Apple 아이콘 생성
    console.log('\n🍎 Generating Apple icon...');
    await generateAppleIcon();

    // iOS 스플래시 이미지 생성
    console.log('\n🖼️  Generating iOS splash screens...');
    for (const splash of SPLASH_SIZES) {
      await generateSplashScreen(splash);
    }

    console.log('\n✅ All PWA assets generated successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Update manifest.json with new icons');
    console.log('   2. Add apple-touch-startup-image links to layout.tsx');

  } catch (error) {
    console.error('❌ Error generating assets:', error);
    process.exit(1);
  }
}

main();
