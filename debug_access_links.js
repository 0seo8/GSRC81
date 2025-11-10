// 현재 access_links 테이블의 데이터와 제약조건 확인
import { supabase } from './src/lib/supabase.js';

async function checkAccessLinks() {
  console.log('=== ACCESS_LINKS 테이블 분석 ===');
  
  // 1. 현재 데이터 확인
  const { data, error } = await supabase
    .from('access_links')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('데이터 조회 오류:', error);
    return;
  }
  
  console.log('현재 데이터 개수:', data.length);
  console.log('데이터 샘플:', data.slice(0, 3));
  
  // 2. access_code 중복 여부 확인
  const accessCodes = data.map(row => row.access_code).filter(Boolean);
  const uniqueAccessCodes = [...new Set(accessCodes)];
  
  console.log('\n=== ACCESS_CODE 분석 ===');
  console.log('총 access_code 개수:', accessCodes.length);
  console.log('고유 access_code 개수:', uniqueAccessCodes.length);
  console.log('중복 여부:', accessCodes.length !== uniqueAccessCodes.length ? '중복 있음' : '중복 없음');
  
  if (uniqueAccessCodes.length > 0) {
    console.log('고유 access_code들:', uniqueAccessCodes);
  }
  
  // 3. kakao_user_id 분석
  const kakaoUserIds = data.map(row => row.kakao_user_id).filter(Boolean);
  const uniqueKakaoIds = [...new Set(kakaoUserIds)];
  
  console.log('\n=== KAKAO_USER_ID 분석 ===');
  console.log('총 kakao_user_id 개수:', kakaoUserIds.length);
  console.log('고유 kakao_user_id 개수:', uniqueKakaoIds.length);
  
  // 4. 구체적인 데이터 구조 분석
  console.log('\n=== 데이터 구조 분석 ===');
  const groupByCode = {};
  data.forEach(row => {
    if (row.access_code) {
      if (!groupByCode[row.access_code]) {
        groupByCode[row.access_code] = [];
      }
      groupByCode[row.access_code].push({
        kakao_user_id: row.kakao_user_id,
        is_active: row.is_active,
        created_at: row.created_at
      });
    }
  });
  
  Object.keys(groupByCode).forEach(code => {
    console.log(`Code "${code}": ${groupByCode[code].length}개 레코드`);
    groupByCode[code].forEach((record, index) => {
      console.log(`  ${index + 1}. kakao_user_id: ${record.kakao_user_id}, active: ${record.is_active}`);
    });
  });
}

checkAccessLinks().catch(console.error);