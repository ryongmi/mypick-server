import {
  Controller,
  Get,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  HttpCode,
  UseGuards,
} from '@nestjs/common';

import { Serialize } from '@krgeobuk/core/decorators';
import { PaginatedResult } from '@krgeobuk/core/interfaces';
import { AccessTokenGuard } from '@krgeobuk/jwt/guards';
import { AuthorizationGuard } from '@krgeobuk/authorization/guards';
import { CurrentJwt } from '@krgeobuk/jwt/decorators';
import type { AuthenticatedJwt } from '@krgeobuk/jwt/interfaces';
import {
  SwaggerApiTags,
  SwaggerApiOperation,
  SwaggerApiOkResponse,
  SwaggerApiPaginatedResponse,
  SwaggerApiErrorResponse,
  SwaggerApiParam,
  SwaggerApiBearerAuth,
} from '@krgeobuk/swagger';

import { ContentService } from '../services/content.service.js';
import { ContentSearchQueryDto } from '../dto/search-query.dto.js';
import { ContentWithCreatorDto } from '../dto/content-response.dto.js';
import { UpdateContentStatusDto } from '../dto/update-content-status.dto.js';
import { BulkUpdateContentStatusDto } from '../dto/bulk-update-content-status.dto.js';
import { ContentStatus } from '../enums/content.enum.js';

@SwaggerApiTags({ tags: ['content'] })
@SwaggerApiBearerAuth()
@UseGuards(AccessTokenGuard, AuthorizationGuard)
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  /**
   * 콘텐츠 검색
   * GET /content?page=1&limit=30&creatorId=xxx&platform=youtube&sortBy=views
   */
  @SwaggerApiOperation({
    summary: '콘텐츠 검색',
    description: '크리에이터, 플랫폼, 타입 등 다양한 조건으로 콘텐츠를 검색합니다.',
  })
  @SwaggerApiPaginatedResponse({
    status: 200,
    description: '콘텐츠 목록 조회 성공',
    dto: ContentWithCreatorDto,
  })
  @SwaggerApiErrorResponse({
    status: 400,
    description: '잘못된 검색 파라미터',
  })
  @SwaggerApiErrorResponse({
    status: 401,
    description: '인증이 필요합니다',
  })
  @Get()
  @HttpCode(200)
  @Serialize({
    message: '콘텐츠 목록 조회 성공',
  })
  async searchContents(
    @Query() query: ContentSearchQueryDto,
    @CurrentJwt() jwt?: AuthenticatedJwt
  ): Promise<PaginatedResult<ContentWithCreatorDto>> {
    // includeAllStatuses가 true인 경우, 본인의 크리에이터 콘텐츠인지 검증
    if (query.includeAllStatuses && query.creatorIds && query.creatorIds.length > 0) {
      if (!jwt) {
        throw new Error('인증이 필요합니다.');
      }

      // 모든 creatorId가 현재 사용자의 것인지 확인
      for (const creatorId of query.creatorIds) {
        const creator = await this.contentService['creatorService'].findById(creatorId);
        if (!creator || creator.userId !== jwt.userId) {
          // 본인의 크리에이터가 아닌 경우, includeAllStatuses를 무시하고 ACTIVE만 조회
          query.includeAllStatuses = false;
          break;
        }
      }
    }

    return await this.contentService.searchContents(query);
  }

  /**
   * 콘텐츠 상세 조회
   * GET /content/:id
   */
  @SwaggerApiOperation({
    summary: '콘텐츠 상세 조회',
    description: '특정 콘텐츠의 상세 정보를 조회합니다. 크리에이터 정보도 함께 포함됩니다.',
  })
  @SwaggerApiParam({
    name: 'id',
    type: String,
    description: '콘텐츠 ID',
    required: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @SwaggerApiOkResponse({
    status: 200,
    description: '콘텐츠 상세 조회 성공',
    dto: ContentWithCreatorDto,
  })
  @SwaggerApiErrorResponse({
    status: 404,
    description: '콘텐츠를 찾을 수 없습니다',
  })
  @SwaggerApiErrorResponse({
    status: 401,
    description: '인증이 필요합니다',
  })
  @Get(':id')
  @HttpCode(200)
  @Serialize({
    message: '콘텐츠 상세 조회 성공',
  })
  async getContentDetail(@Param('id') id: string): Promise<ContentWithCreatorDto | null> {
    return await this.contentService.findWithCreator(id);
  }

  // ==================== CREATOR DASHBOARD APIs ====================

  /**
   * 크리에이터가 자신의 콘텐츠 상태 변경 (공개/비공개 전환 등)
   * PATCH /content/:id/status
   */
  @SwaggerApiOperation({
    summary: '콘텐츠 상태 변경 (크리에이터 전용)',
    description: '크리에이터가 자신의 콘텐츠 상태를 변경합니다 (공개/비공개 등).',
  })
  @SwaggerApiParam({
    name: 'id',
    type: String,
    description: '콘텐츠 ID',
  })
  @SwaggerApiOkResponse({
    status: 200,
    description: '콘텐츠 상태 변경 성공',
    dto: null,
  })
  @SwaggerApiErrorResponse({
    status: 403,
    description: '권한 없음 (본인의 콘텐츠만 수정 가능)',
  })
  @SwaggerApiErrorResponse({
    status: 404,
    description: '콘텐츠를 찾을 수 없습니다',
  })
  @Patch(':id/status')
  @HttpCode(200)
  @Serialize({
    message: '콘텐츠 상태가 변경되었습니다',
  })
  async updateContentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContentStatusDto,
    @CurrentJwt() { userId }: AuthenticatedJwt
  ): Promise<void> {
    await this.contentService.updateContentStatusByCreator(id, userId, dto.status);
  }

  /**
   * 크리에이터가 자신의 콘텐츠 삭제 (소프트 삭제)
   * DELETE /content/:id
   */
  @SwaggerApiOperation({
    summary: '콘텐츠 삭제 (크리에이터 전용)',
    description: '크리에이터가 자신의 콘텐츠를 삭제합니다 (소프트 삭제).',
  })
  @SwaggerApiParam({
    name: 'id',
    type: String,
    description: '콘텐츠 ID',
  })
  @SwaggerApiOkResponse({
    status: 200,
    description: '콘텐츠 삭제 성공',
    dto: null,
  })
  @SwaggerApiErrorResponse({
    status: 403,
    description: '권한 없음 (본인의 콘텐츠만 삭제 가능)',
  })
  @SwaggerApiErrorResponse({
    status: 404,
    description: '콘텐츠를 찾을 수 없습니다',
  })
  @Delete(':id')
  @HttpCode(200)
  @Serialize({
    message: '콘텐츠가 삭제되었습니다',
  })
  async deleteContent(
    @Param('id') id: string,
    @CurrentJwt() { userId }: AuthenticatedJwt
  ): Promise<void> {
    await this.contentService.updateContentStatusByCreator(id, userId, ContentStatus.REMOVED);
  }

  /**
   * 크리에이터가 자신의 여러 콘텐츠 상태 일괄 변경
   * PATCH /content/bulk-update-status
   */
  @SwaggerApiOperation({
    summary: '콘텐츠 일괄 상태 변경 (크리에이터 전용)',
    description: '크리에이터가 자신의 여러 콘텐츠 상태를 동시에 변경합니다.',
  })
  @SwaggerApiOkResponse({
    status: 200,
    description: '콘텐츠 일괄 상태 변경 성공',
    dto: null,
  })
  @SwaggerApiErrorResponse({
    status: 403,
    description: '권한 없음 (본인의 콘텐츠만 수정 가능)',
  })
  @SwaggerApiErrorResponse({
    status: 400,
    description: '잘못된 요청 (contentIds가 비어있음)',
  })
  @Patch('bulk-update-status')
  @HttpCode(200)
  @Serialize({
    message: '콘텐츠 상태가 일괄 변경되었습니다',
  })
  async bulkUpdateContentStatus(
    @Body() dto: BulkUpdateContentStatusDto,
    @CurrentJwt() { userId }: AuthenticatedJwt
  ): Promise<void> {
    await this.contentService.bulkUpdateContentStatusByCreator(dto.contentIds, userId, dto.status);
  }
}
