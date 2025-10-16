import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iogbdjpvcxtdchmpicma.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZ2JkanB2Y3h0ZGNobXBpY21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzQ4OTksImV4cCI6MjA2OTExMDg5OX0.VYjDndY5TUZPTopRCufPkPyl9yJKq6qTl8K_-qjjYjM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthData() {
  console.log('🔍 인증 데이터 확인 중...\n');

  try {
    // access_links 테이블 확인
    const { data: accessData, error: accessError } = await supabase
      .from('access_links')
      .select('*');

    if (accessError) {
      console.log('❌ access_links 조회 실패:', accessError.message);
    } else {
      console.log('📋 access_links 데이터:');
      accessData?.forEach(link => {
        console.log(`  - access_code: ${link.access_code}`);
        console.log(`  - password_hash: ${link.password_hash}`);
        console.log(`  - is_active: ${link.is_active}`);
        console.log('  ---');
      });
    }

    // admin 테이블 확인
    const { data: adminData, error: adminError } = await supabase
      .from('admin')
      .select('*');

    if (adminError) {
      console.log('❌ admin 조회 실패:', adminError.message);
    } else {
      console.log('\n👤 admin 데이터:');
      adminData?.forEach(admin => {
        console.log(`  - username: ${admin.username}`);
        console.log(`  - password_hash: ${admin.password_hash}`);
        console.log('  ---');
      });
    }

  } catch (error) {
    console.error('❌ 데이터 확인 실패:', error.message);
  }
}

checkAuthData();
