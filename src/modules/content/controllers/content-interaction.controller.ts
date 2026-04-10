import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  HttpCode,
  UseGuards,
} from '@nestjs/common';

import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

import { Serialize } from '@krgeobuk/core/decorators';
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
import { UserInteractionService } from '../../user-interaction/services/user-interaction.service.js';
import { YouTubeOAuthService } from '../../external-api/services/youtube-oauth.service.js';
import { YouTubeApiService } from '../../external-api/services/youtube-api.service.js';

class PostYouTubeCommentDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(10000)
  text!: string;
}

@SwaggerApiTags({ tags: ['content'] })
@SwaggerApiBearerAuth()
@UseGuards(AccessTokenGuard, AuthorizationGuard)
@Controller('content')
export class ContentInteractionController {
  constructor(
    private readonly contentService: ContentService,
    private readonly interactionService: UserInteractionService,
    private readonly youtubeOAuthService: YouTubeOAuthService,
    private readonly youtubeApiService: YouTubeApiService
  ) {}

  // ==================== BOOKMARK ENDPOINTS ====================

  /**
   * 북마크한 콘텐츠 목록 조회 (전체 콘텐츠 정보 포함)
   * GET /content/bookmarks?page=1&limit=20
   */
  @SwaggerApiOperation({
    summary: '북마크 목록 조회',
    description: '현재 사용자가 북마크한 콘텐츠 목록을 조회합니다.',
  })
  @SwaggerApiPaginatedResponse({
    status: 200,
    description: '북마크 목록 조회 성공',
    dto: ContentWithCreatorDto,
  })
  @SwaggerApiErrorResponse({
    status: 401,
    description: '인증이 필요합니다',
  })
  @Get('bookmarks')
  @HttpCode(200)
  @Serialize({
    message: '북마크 목록 조회 성공',
  })
  async getBookmarkedContents(
    @CurrentJwt() { userId }: AuthenticatedJwt,
    @Query() query: ContentSearchQueryDto
  ): Promise<{
    items: ContentWithCreatorDto[];
    pageInfo: {
      totalItems: number;
      page: number;
      limit: number;
      totalPages: number;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
    };
  }> {
    return await this.contentService.findBookmarkedContents(userId, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  /**
   * 북마크 추가
   * POST /content/:id/bookmark
   */
  @SwaggerApiOperation({
    summary: '북마크 추가',
    description: '콘텐츠를 북마크에 추가합니다.',
  })
  @SwaggerApiParam({
    name: 'id',
    type: String,
    description: '콘텐츠 ID',
    required: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @SwaggerApiOkResponse({
    status: 204,
    description: '북마크 추가 성공',
  })
  @SwaggerApiErrorResponse({
    status: 400,
    description: '이미 북마크에 추가된 콘텐츠입니다',
  })
  @SwaggerApiErrorResponse({
    status: 404,
    description: '콘텐츠를 찾을 수 없습니다',
  })
  @SwaggerApiErrorResponse({
    status: 401,
    description: '인증이 필요합니다',
  })
  @Post(':id/bookmark')
  @HttpCode(204)
  @Serialize({
    message: '북마크 추가 성공',
  })
  async bookmarkContent(
    @Param('id') contentId: string,
    @CurrentJwt() { userId }: AuthenticatedJwt
  ): Promise<void> {
    await this.interactionService.bookmarkContent(userId, contentId);
  }

  /**
   * 북마크 제거
   * DELETE /content/:id/bookmark
   */
  @SwaggerApiOperation({
    summary: '북마크 제거',
    description: '콘텐츠를 북마크에서 제거합니다.',
  })
  @SwaggerApiParam({
    name: 'id',
    type: String,
    description: '콘텐츠 ID',
    required: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @SwaggerApiOkResponse({
    status: 204,
    description: '북마크 제거 성공',
  })
  @SwaggerApiErrorResponse({
    status: 404,
    description: '북마크를 찾을 수 없습니다',
  })
  @SwaggerApiErrorResponse({
    status: 401,
    description: '인증이 필요합니다',
  })
  @Delete(':id/bookmark')
  @HttpCode(204)
  @Serialize({
    message: '북마크 제거 성공',
  })
  async removeBookmark(
    @Param('id') contentId: string,
    @CurrentJwt() { userId }: AuthenticatedJwt
  ): Promise<void> {
    await this.interactionService.removeBookmark(userId, contentId);
  }

  // ==================== LIKE ENDPOINTS ====================

  /**
   * 좋아요 추가
   * POST /content/:id/like
   */
  @SwaggerApiOperation({
    summary: '좋아요 추가',
    description: '콘텐츠에 좋아요를 추가합니다.',
  })
  @SwaggerApiParam({
    name: 'id',
    type: String,
    description: '콘텐츠 ID',
    required: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @SwaggerApiOkResponse({
    status: 204,
    description: '좋아요 추가 성공',
  })
  @SwaggerApiErrorResponse({
    status: 400,
    description: '이미 좋아요를 누른 콘텐츠입니다',
  })
  @SwaggerApiErrorResponse({
    status: 404,
    description: '콘텐츠를 찾을 수 없습니다',
  })
  @SwaggerApiErrorResponse({
    status: 401,
    description: '인증이 필요합니다',
  })
  @Post(':id/like')
  @HttpCode(204)
  @Serialize({
    message: '좋아요 추가 성공',
  })
  async likeContent(
    @Param('id') contentId: string,
    @CurrentJwt() { userId }: AuthenticatedJwt
  ): Promise<void> {
    await this.interactionService.likeContent(userId, contentId);
  }

  /**
   * 좋아요 제거
   * DELETE /content/:id/like
   */
  @SwaggerApiOperation({
    summary: '좋아요 제거',
    description: '콘텐츠에서 좋아요를 제거합니다.',
  })
  @SwaggerApiParam({
    name: 'id',
    type: String,
    description: '콘텐츠 ID',
    required: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @SwaggerApiOkResponse({
    status: 204,
    description: '좋아요 제거 성공',
  })
  @SwaggerApiErrorResponse({
    status: 404,
    description: '좋아요를 찾을 수 없습니다',
  })
  @SwaggerApiErrorResponse({
    status: 401,
    description: '인증이 필요합니다',
  })
  @Delete(':id/like')
  @HttpCode(204)
  @Serialize({
    message: '좋아요 제거 성공',
  })
  async unlikeContent(
    @Param('id') contentId: string,
    @CurrentJwt() { userId }: AuthenticatedJwt
  ): Promise<void> {
    await this.interactionService.unlikeContent(userId, contentId);
  }

  // ==================== YOUTUBE ACTION ENDPOINTS ====================

  /**
   * YouTube 댓글 작성
   * POST /content/:id/youtube-comment
   */
  @SwaggerApiOperation({
    summary: 'YouTube 댓글 작성',
    description: '콘텐츠의 YouTube 원본 영상에 댓글을 작성합니다. Google OAuth 토큰이 필요합니다.',
  })
  @SwaggerApiParam({
    name: 'id',
    type: String,
    description: '콘텐츠 ID',
    required: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @SwaggerApiOkResponse({
    status: 201,
    description: '댓글 작성 성공 (응답: { commentId: string })',
  })
  @SwaggerApiErrorResponse({
    status: 401,
    description: 'YouTube OAuth 토큰이 없습니다. Google 재로그인 필요',
  })
  @SwaggerApiErrorResponse({
    status: 404,
    description: '콘텐츠를 찾을 수 없습니다',
  })
  @Post(':id/youtube-comment')
  @HttpCode(201)
  @Serialize({ message: 'YouTube 댓글 작성 성공' })
  async postYouTubeComment(
    @Param('id') contentId: string,
    @CurrentJwt() { userId }: AuthenticatedJwt,
    @Body() dto: PostYouTubeCommentDto
  ): Promise<{ commentId: string }> {
    const content = await this.contentService.findByIdOrFail(contentId);
    const { accessToken } = await this.youtubeOAuthService.getAccessToken(userId);
    return this.youtubeApiService.insertComment(accessToken, content.platformId, dto.text);
  }

  /**
   * YouTube 좋아요
   * POST /content/:id/youtube-like
   */
  @SwaggerApiOperation({
    summary: 'YouTube 좋아요',
    description: '콘텐츠의 YouTube 원본 영상에 좋아요를 누릅니다. Google OAuth 토큰이 필요합니다.',
  })
  @SwaggerApiParam({
    name: 'id',
    type: String,
    description: '콘텐츠 ID',
    required: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @SwaggerApiOkResponse({
    status: 204,
    description: 'YouTube 좋아요 성공',
  })
  @SwaggerApiErrorResponse({
    status: 401,
    description: 'YouTube OAuth 토큰이 없습니다. Google 재로그인 필요',
  })
  @SwaggerApiErrorResponse({
    status: 404,
    description: '콘텐츠를 찾을 수 없습니다',
  })
  @Post(':id/youtube-like')
  @HttpCode(204)
  @Serialize({ message: 'YouTube 좋아요 성공' })
  async likeOnYouTube(
    @Param('id') contentId: string,
    @CurrentJwt() { userId }: AuthenticatedJwt
  ): Promise<void> {
    const content = await this.contentService.findByIdOrFail(contentId);
    const { accessToken } = await this.youtubeOAuthService.getAccessToken(userId);
    await this.youtubeApiService.likeVideo(accessToken, content.platformId);
  }
}
