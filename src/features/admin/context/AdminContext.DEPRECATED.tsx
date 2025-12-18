/**
 * ⚠️ DEPRECATED: 이 파일은 보안 취약점으로 인해 사용하지 않습니다.
 *
 * 문제점:
 * - localStorage에 인증 정보 저장 (XSS 공격 취약)
 * - 클라이언트에서 Admin 테이블 직접 조회 (테이블 노출)
 * - 클라이언트에서 bcrypt 해싱 (보안 취약)
 *
 * 새로운 방식:
 *
 * @example
 * ```typescript
 * // Before (기존 방식 - 보안 취약)
 * import { useAdmin } from '@/features/admin/context/AdminContext';
 * const { isAdmin } = useAdmin();
 *
 * // After (새 방식 - 안전)
 * import { getAdminSession } from '@/app/actions/admin-auth';
 *
 * // Server Component에서
 * const session = await getAdminSession();
 * if (!session) redirect('/admin/login');
 *
 * // Client Component에서
 * // Server Action으로 로그인
 * import { loginAdmin } from '@/app/actions/admin-auth';
 * await loginAdmin(username, password);
 * ```
 *
 * 마이그레이션 가이드: /docs/admin-auth-migration.md
 */

export * from "./AdminContext";
