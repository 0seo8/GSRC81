/**
 * PWA 아이콘 및 스플래시 이미지 생성 스크립트
 *
 * SVG를 소스로 사용하여 고해상도 PNG 생성
 *
 * 생성되는 파일:
 * - icon-192x192.png: PWA 아이콘 (manifest.json용)
 * - icon-512x512.png: PWA 아이콘 (manifest.json용, 스플래시용)
 * - apple-icon-180x180.png: iOS 홈 화면 아이콘
 * - apple-splash-*.png: iOS 스플래시 이미지 (다양한 해상도)
 */

import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const logoSvgPath = join(publicDir, 'logo.svg');
const logoPngPath = join(publicDir, 'logo.png'); // fallback

// SVG를 지정된 크기의 PNG 버퍼로 변환
async function svgToPng(width, height) {
  try {
    const svgBuffer = await readFile(logoSvgPath);
    return await sharp(svgBuffer, { density: 300 }) // 고해상도 렌더링
      .resize(width, height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
  } catch (error) {
    console.log('⚠️  SVG not found, falling back to PNG...');
    return await sharp(logoPngPath)
      .resize(width, height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
  }
}

// 브랜드 컬러 (manifest.json background_color, CSS --color-bg-base와 동일)
const BACKGROUND_COLOR = { r: 235, g: 231, b: 228 }; // #ebe7e4 (따뜻한 베이지)
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
  // 로고를 정사각형에 맞게 리사이즈 (패딩 포함)
  const logoSize = Math.floor(size * 0.65); // 로고가 아이콘의 65% 차지

  // SVG에서 고해상도 PNG로 변환
  const resizedLogo = await svgToPng(logoSize, logoSize);

  // 배경 이미지 생성 후 로고 합성
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
    .toFile(join(publicDir, `icon-${size}x${size}.png`));

  console.log(`✓ Generated icon-${size}x${size}.png (from SVG)`);
}

async function generateAppleIcon() {
  const size = 180;
  const logoSize = Math.floor(size * 0.65);

  // SVG에서 고해상도 PNG로 변환
  const resizedLogo = await svgToPng(logoSize, logoSize);

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

  console.log('✓ Generated apple-icon-180x180.png (from SVG)');
}

async function generateSplashScreen({ width, height, name }) {
  // 커스텀 스플래시와 동일한 로고 크기 계산
  // 앱에서 로고: 296x187 CSS pixels
  // 디바이스 픽셀 비율에 맞게 스케일링

  // 디바이스별 픽셀 비율 추정 (width 기준)
  const devicePixelRatio = width <= 828 ? 2 : 3;
  const cssWidth = width / devicePixelRatio;

  // 커스텀 스플래시의 로고 비율과 동일하게 (화면 대비 약 76% - 296/390 ≈ 0.76)
  const logoRatio = 0.76;
  const logoWidth = Math.floor(cssWidth * logoRatio * devicePixelRatio);
  const logoHeight = Math.floor(logoWidth * (187 / 296)); // 원본 비율 유지 (187/296)

  // SVG에서 고해상도 PNG로 변환
  const resizedLogo = await svgToPng(logoWidth, logoHeight);

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

  console.log(`✓ Generated apple-splash-${width}x${height}.png (${name}) - logo: ${logoWidth}x${logoHeight}`);
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
