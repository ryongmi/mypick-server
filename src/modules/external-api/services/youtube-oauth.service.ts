import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';

import { lastValueFrom } from 'rxjs';

import { OAuthTcpPatterns } from '@krgeobuk/oauth/tcp/patterns';
import type { TcpYouTubeTokenParams, TcpYouTubeTokenResult } from '@krgeobuk/oauth/tcp/interfaces';

import { ExternalApiException } from '../exceptions/index.js';

@Injectable()
export class YouTubeOAuthService {
  private readonly logger = new Logger(YouTubeOAuthService.name);

  constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy) {}

  // ==================== PUBLIC METHODS ====================

  /**
   * auth-server TCP를 통해 사용자의 YouTube OAuth 액세스 토큰 조회
   * - 토큰이 만료된 경우 auth-server에서 자동으로 갱신하여 반환
   */
  async getAccessToken(userId: string): Promise<TcpYouTubeTokenResult> {
    try {
      this.logger.debug(`Fetching YouTube access token for user: ${userId}`);

      const result = await lastValueFrom(
        this.authClient.send<TcpYouTubeTokenResult, TcpYouTubeTokenParams>(
          OAuthTcpPatterns.YOUTUBE_GET_ACCESS_TOKEN,
          { userId }
        )
      );

      this.logger.debug(`YouTube access token fetched for user: ${userId}`);
      return result;
    } catch (error: unknown) {
      this.logger.warn(`Failed to fetch YouTube access token for user: ${userId}`, { error });
      this.handleOAuthTcpError(error);
    }
  }

  /**
   * auth-server TCP를 통해 사용자의 YouTube OAuth 권한 여부 확인
   */
  async hasAccess(userId: string): Promise<boolean> {
    try {
      return await lastValueFrom(
        this.authClient.send<boolean, TcpYouTubeTokenParams>(OAuthTcpPatterns.YOUTUBE_HAS_ACCESS, {
          userId,
        })
      );
    } catch (error: unknown) {
      this.logger.warn(`Failed to check YouTube access for user: ${userId}`, { error });
      return false;
    }
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * TCP RpcException을 HTTP Exception으로 변환
   * auth-server의 OAUTH_110/111/112 에러 코드를 처리
   */
  private handleOAuthTcpError(error: unknown): never {
    if (error instanceof RpcException) {
      const rpcError = error.getError() as { code?: string; message?: string } | string;
      const code = typeof rpcError === 'object' ? rpcError?.code : undefined;

      if (code === 'OAUTH_110' || code === 'OAUTH_111') {
        // 토큰 없음 또는 리프레시 토큰 없음 → Google 재로그인 필요
        throw ExternalApiException.youtubeTokenNotFound();
      }

      if (code === 'OAUTH_112') {
        // 토큰 갱신 실패
        throw ExternalApiException.youtubeTokenRefreshFailed();
      }
    }

    throw ExternalApiException.youtubeApiError();
  }
}
