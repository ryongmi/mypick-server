/**
 * 크리에이터 신청 관련 권한 상수
 */
export const CREATOR_REGISTRATION_PERMISSIONS = {
  /** 크리에이터 신청 목록/통계 조회 */
  READ: 'creator-registration:read',
  /** 크리에이터 신청 검토 (승인/거부) */
  REVIEW: 'creator-registration:review',
} as const;
