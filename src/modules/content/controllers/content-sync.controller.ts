import { Controller, Post, Param, HttpCode, UseGuards } from '@nestjs/common';

import { Serialize } from '@krgeobuk/core/decorators';
import { AccessTokenGuard } from '@krgeobuk/jwt/guards';
import { AuthorizationGuard } from '@krgeobuk/authorization/guards';
import {
  SwaggerApiTags,
  SwaggerApiOperation,
  SwaggerApiOkResponse,
  SwaggerApiErrorResponse,
  SwaggerApiParam,
  SwaggerApiBearerAuth,
} from '@krgeobuk/swagger';

import { YouTubeSyncScheduler } from '../../external-api/services/youtube-sync.scheduler.js';

@SwaggerApiTags({ tags: ['content'] })
@SwaggerApiBearerAuth()
@UseGuards(AccessTokenGuard, AuthorizationGuard)
@Controller('content')
export class ContentSyncController {
  constructor(private readonly youtubeSyncScheduler: YouTubeSyncScheduler) {}

  // ==================== ADMIN SYNC ENDPOINTS ====================

  /**
   * 플랫폼 콘텐츠 수동 동기화 (관리자용)
   * POST /content/sync/:platformId
   *
   * Note: 관리자 권한 검증은 추후 추가 예정
   */
  @SwaggerApiOperation({
    summary: '플랫폼 콘텐츠 수동 동기화',
    description: '특정 플랫폼의 콘텐츠를 수동으로 동기화합니다. (관리자용)',
  })
  @SwaggerApiParam({
    name: 'platformId',
    type: String,
    description: '플랫폼 ID',
    required: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @SwaggerApiOkResponse({
    status: 200,
    description:
      '콘텐츠 동기화 요청 처리 완료 (응답: { success: boolean, message: string, syncedCount?: number, error?: string })',
  })
  @SwaggerApiErrorResponse({
    status: 404,
    description: '플랫폼을 찾을 수 없습니다',
  })
  @SwaggerApiErrorResponse({
    status: 401,
    description: '인증이 필요합니다',
  })
  @Post('sync/:platformId')
  @HttpCode(200)
  @Serialize({
    message: '콘텐츠 동기화 요청 처리 완료',
  })
  async syncPlatformContent(@Param('platformId') platformId: string): Promise<{
    success: boolean;
    message: string;
    syncedCount?: number;
    error?: string;
  }> {
    return await this.youtubeSyncScheduler.syncSinglePlatform(platformId);
  }

  /**
   * 크리에이터 전체 콘텐츠 동기화 (초기 동기화)
   * POST /content/sync/:platformId/full
   *
   * Note: 관리자 권한 검증은 추후 추가 예정
   */
  @SwaggerApiOperation({
    summary: '전체 콘텐츠 동기화',
    description:
      '특정 플랫폼의 모든 콘텐츠를 동기화합니다. 초기 동기화 또는 전체 재수집 시 사용합니다. (관리자용)',
  })
  @SwaggerApiParam({
    name: 'platformId',
    type: String,
    description: '플랫폼 ID',
    required: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @SwaggerApiOkResponse({
    status: 200,
    description:
      '전체 콘텐츠 동기화 요청 처리 완료 (응답: { success: boolean, message: string, totalCount?: number, estimatedQuotaUsage?: number, error?: string })',
  })
  @SwaggerApiErrorResponse({
    status: 404,
    description: '플랫폼을 찾을 수 없습니다',
  })
  @SwaggerApiErrorResponse({
    status: 401,
    description: '인증이 필요합니다',
  })
  @Post('sync/:platformId/full')
  @HttpCode(200)
  @Serialize({
    message: '전체 콘텐츠 동기화 요청 처리 완료',
  })
  async syncAllPlatformContent(@Param('platformId') platformId: string): Promise<{
    success: boolean;
    message: string;
    totalCount?: number;
    estimatedQuotaUsage?: number;
    error?: string;
  }> {
    return await this.youtubeSyncScheduler.syncAllContent(platformId);
  }

  /**
   * 초기 동기화 재개
   * POST /content/sync/:platformId/resume
   *
   * Note: 관리자 권한 검증은 추후 추가 예정
   */
  @SwaggerApiOperation({
    summary: '초기 동기화 재개',
    description: '일시 중지되었던 초기 동기화를 재개합니다. (관리자용)',
  })
  @SwaggerApiParam({
    name: 'platformId',
    type: String,
    description: '플랫폼 ID',
    required: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @SwaggerApiOkResponse({
    status: 200,
    description:
      '초기 동기화 재개 요청 처리 완료 (응답: { success: boolean, message: string, resumedCount?: number, error?: string })',
  })
  @SwaggerApiErrorResponse({
    status: 404,
    description: '플랫폼을 찾을 수 없습니다',
  })
  @SwaggerApiErrorResponse({
    status: 401,
    description: '인증이 필요합니다',
  })
  @Post('sync/:platformId/resume')
  @HttpCode(200)
  @Serialize({
    message: '초기 동기화 재개 요청 처리 완료',
  })
  async resumeInitialSync(@Param('platformId') platformId: string): Promise<{
    success: boolean;
    message: string;
    resumedCount?: number;
    error?: string;
  }> {
    return await this.youtubeSyncScheduler.resumeInitialSync(platformId);
  }
}
