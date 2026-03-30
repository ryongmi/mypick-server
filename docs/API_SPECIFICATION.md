# MyPick Server - API 명세서

## 📋 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [API 설계 원칙](#api-설계-원칙)
3. [인증 시스템](#인증-시스템)
4. [도메인별 API 엔드포인트](#도메인별-api-엔드포인트)
5. [데이터 모델](#데이터-모델)
6. [에러 처리](#에러-처리)
7. [WebSocket 이벤트](#websocket-이벤트)
8. [외부 API 통합](#외부-api-통합)

---

## 📖 프로젝트 개요

MyPick Server는 크리에이터/유튜버 팬들을 위한 통합 콘텐츠 허브 서비스의 백엔드 API 서버입니다.

### 🎯 핵심 기능
- **멀티플랫폼 콘텐츠 통합**: YouTube, Twitter, Instagram 등 다양한 플랫폼의 콘텐츠 수집 및 통합
- **AI 기반 개인화 추천**: 사용자 선호도 분석을 통한 맞춤형 콘텐츠 추천
- **실시간 알림 시스템**: WebSocket 기반 즉시 알림 및 업데이트
- **크리에이터 관리**: 크리에이터 등록, 승인, 분석 기능
- **사용자 커뮤니티**: 팬 커뮤니티 및 소셜 기능

---

## 🔧 API 설계 원칙

### RESTful 설계 표준
```
GET    /api/v1/resources        # 리소스 목록 조회
GET    /api/v1/resources/:id    # 특정 리소스 조회
POST   /api/v1/resources        # 리소스 생성
PUT    /api/v1/resources/:id    # 리소스 전체 수정
PATCH  /api/v1/resources/:id    # 리소스 부분 수정
DELETE /api/v1/resources/:id    # 리소스 삭제
```

### 표준 응답 형식
```typescript
// 성공 응답
{
  "success": true,
  "data": T,
  "pagination"?: {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  },
  "metadata"?: {
    "timestamp": string,
    "version": string
  }
}

// 에러 응답
{
  "success": false,
  "error": {
    "code": string,
    "message": string,
    "details"?: any
  }
}
```

---

## 🔐 인증 시스템

### JWT 기반 인증
```typescript
// 인증 헤더
Authorization: Bearer <access_token>

// 토큰 구조
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "user" | "admin" | "premium",
  "iat": timestamp,
  "exp": timestamp
}
```

### 토큰 갱신 플로우
1. Access Token (1시간) + Refresh Token (7일)
2. Access Token 만료 시 Refresh Token으로 갱신
3. Refresh Token 만료 시 재로그인 필요

---

## 🌐 도메인별 API 엔드포인트

## 1. 인증 (Authentication)

### 1.1 로그인
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe"?: boolean
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "name": "김철수",
      "email": "user@example.com",
      "role": "user",
      "avatar": "https://example.com/avatar.jpg"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 3600
    }
  }
}
```

### 1.2 회원가입
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "김철수",
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "acceptTerms": true
}
```

### 1.3 토큰 갱신
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 1.4 로그아웃
```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

### 1.5 OAuth 인증
```http
GET /api/v1/auth/google
GET /api/v1/auth/google/callback?code=...&state=...
GET /api/v1/auth/naver
GET /api/v1/auth/naver/callback?code=...&state=...
```

---

## 2. 사용자 관리 (Users)

### 2.1 프로필 조회
```http
GET /api/v1/users/profile
Authorization: Bearer <access_token>
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "김철수",
    "email": "user@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "role": "user",
    "serviceStatus": "active",
    "userType": "user",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "preferences": {
      "categories": ["gaming", "music"],
      "notifications": {
        "newVideo": true,
        "liveStream": true,
        "weeklyDigest": false
      }
    }
  }
}
```

### 2.2 프로필 수정
```http
PUT /api/v1/users/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "김철수",
  "avatar": "https://example.com/new-avatar.jpg",
  "preferences": {
    "categories": ["gaming", "music", "tech"],
    "notifications": {
      "newVideo": true,
      "liveStream": false,
      "weeklyDigest": true
    }
  }
}
```

### 2.3 사용자 설정 조회
```http
GET /api/v1/users/settings
Authorization: Bearer <access_token>
```

### 2.4 사용자 설정 수정
```http
PUT /api/v1/users/settings
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "theme": "dark",
  "language": "ko",
  "timezone": "Asia/Seoul",
  "notifications": {
    "email": true,
    "push": true,
    "desktop": false
  }
}
```

---

## 3. 크리에이터 (Creators)

### 3.1 크리에이터 목록 조회
```http
GET /api/v1/creators?page=1&limit=20&category=gaming&sort=followers_desc
Authorization: Bearer <access_token>
```

**쿼리 파라미터:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20, 최대: 100)
- `category`: 카테고리 필터링
- `platform`: 플랫폼 필터링 (youtube, twitter, instagram)
- `sort`: 정렬 (followers_desc, followers_asc, name_asc, created_desc)
- `search`: 검색어

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Ado",
      "displayName": "Ado",
      "avatar": "https://example.com/ado-avatar.jpg",
      "description": "일본의 인기 가수",
      "isVerified": true,
      "followerCount": 3500000,
      "contentCount": 42,
      "totalViews": 850000000,
      "platforms": [
        {
          "type": "youtube",
          "platformId": "UCTest123",
          "url": "https://youtube.com/c/ado",
          "followerCount": 3500000,
          "isActive": true,
          "lastSyncAt": "2024-01-01T00:00:00Z"
        }
      ],
      "isSubscribed": true,
      "category": "music",
      "tags": ["jpop", "vocalist"],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 3.2 크리에이터 상세 조회
```http
GET /api/v1/creators/:id
Authorization: Bearer <access_token>
```

### 3.3 크리에이터 구독
```http
POST /api/v1/creators/:id/subscribe
Authorization: Bearer <access_token>
```

**응답:**
```json
{
  "success": true,
  "data": {
    "subscribed": true,
    "subscriberCount": 3500001
  }
}
```

### 3.4 크리에이터 구독 해제
```http
DELETE /api/v1/creators/:id/subscribe
Authorization: Bearer <access_token>
```

### 3.5 크리에이터 통계
```http
GET /api/v1/creators/:id/stats
Authorization: Bearer <access_token>
```

**응답:**
```json
{
  "success": true,
  "data": {
    "followersCount": 3500000,
    "contentCount": 42,
    "totalViews": 850000000,
    "engagementRate": 8.5,
    "growthRate": 15.2,
    "averageViews": 2500000,
    "recentActivity": [
      {
        "date": "2024-01-01",
        "type": "video_upload",
        "title": "새로운 노래 발표",
        "views": 5000000
      }
    ]
  }
}
```

### 3.6 크리에이터 신청
```http
POST /api/v1/creator-application
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "channelInfo": {
    "platform": "youtube",
    "channelId": "UCExample123",
    "channelUrl": "https://youtube.com/c/example"
  },
  "subscriberCount": 10000,
  "contentCategory": "gaming",
  "sampleVideos": [
    {
      "title": "샘플 영상 1",
      "url": "https://youtube.com/watch?v=example1",
      "views": 50000
    }
  ],
  "description": "게임 콘텐츠를 주로 제작합니다."
}
```

### 3.7 크리에이터 신청 상태 조회
```http
GET /api/v1/creator-application/status
Authorization: Bearer <access_token>
```

---

## 4. 콘텐츠 (Content)

### 4.1 콘텐츠 피드 조회
```http
GET /api/v1/content?page=1&limit=20&platform=youtube&category=gaming
Authorization: Bearer <access_token>
```

**쿼리 파라미터:**
- `page`, `limit`: 페이지네이션
- `platform`: 플랫폼 필터 (youtube, twitter, instagram)
- `category`: 카테고리 필터
- `creators`: 크리에이터 ID 목록 (comma-separated)
- `sort`: 정렬 (latest, popular, trending)
- `dateFrom`, `dateTo`: 날짜 범위

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "type": "youtube_video",
      "title": "[MV] 新時代 (ウタ from ONE PIECE FILM RED)",
      "description": "映画『ONE PIECE FILM RED』主題歌",
      "thumbnail": "https://img.youtube.com/vi/SeXBiXcEBkY/hqdefault.jpg",
      "url": "https://youtube.com/watch?v=SeXBiXcEBkY",
      "platform": "youtube",
      "platformId": "SeXBiXcEBkY",
      "duration": 240,
      "publishedAt": "2024-01-01T00:00:00Z",
      "creator": {
        "id": "1",
        "name": "Ado",
        "avatar": "https://example.com/ado-avatar.jpg"
      },
      "statistics": {
        "views": 250000000,
        "likes": 5200000,
        "comments": 185000,
        "shares": 125000
      },
      "userInteraction": {
        "isBookmarked": false,
        "isLiked": false,
        "watchedAt": null
      },
      "metadata": {
        "tags": ["music", "anime", "onepiece"],
        "category": "music",
        "language": "ja",
        "isLive": false,
        "quality": "hd"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1250,
    "totalPages": 63
  }
}
```

### 4.2 콘텐츠 상세 조회
```http
GET /api/v1/content/:id
Authorization: Bearer <access_token>
```

### 4.3 콘텐츠 북마크 추가
```http
POST /api/v1/content/:id/bookmark
Authorization: Bearer <access_token>
```

### 4.4 콘텐츠 북마크 제거
```http
DELETE /api/v1/content/:id/bookmark
Authorization: Bearer <access_token>
```

### 4.5 콘텐츠 좋아요
```http
POST /api/v1/content/:id/like
Authorization: Bearer <access_token>
```

### 4.6 콘텐츠 좋아요 취소
```http
DELETE /api/v1/content/:id/like
Authorization: Bearer <access_token>
```

### 4.7 북마크 목록 조회
```http
GET /api/v1/content/bookmarks?page=1&limit=20
Authorization: Bearer <access_token>
```

### 4.8 관련 콘텐츠 조회
```http
GET /api/v1/content/:id/related?limit=10
Authorization: Bearer <access_token>
```

---

## 5. 알림 (Notifications)

### 5.1 알림 목록 조회
```http
GET /api/v1/notifications?page=1&limit=20&unreadOnly=false
Authorization: Bearer <access_token>
```

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "type": "new_video",
      "title": "새로운 영상이 업로드되었습니다",
      "message": "Ado님이 새로운 영상을 업로드했습니다: '[MV] 新時代'",
      "isRead": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "data": {
        "creatorId": "1",
        "creatorName": "Ado",
        "contentId": "1",
        "contentTitle": "[MV] 新時代",
        "thumbnail": "https://img.youtube.com/vi/SeXBiXcEBkY/hqdefault.jpg"
      },
      "actionUrl": "/video/1"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### 5.2 읽지 않은 알림 수 조회
```http
GET /api/v1/notifications/unread-count
Authorization: Bearer <access_token>
```

**응답:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

### 5.3 알림 읽음 처리
```http
PUT /api/v1/notifications/:id/read
Authorization: Bearer <access_token>
```

### 5.4 모든 알림 읽음 처리
```http
PUT /api/v1/notifications/read-all
Authorization: Bearer <access_token>
```

### 5.5 알림 설정 조회
```http
GET /api/v1/notifications/settings
Authorization: Bearer <access_token>
```

### 5.6 알림 설정 수정
```http
PUT /api/v1/notifications/settings
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "newVideo": true,
  "liveStream": true,
  "weeklyDigest": false,
  "creatorUpdates": true,
  "communityPosts": false,
  "emailNotifications": true,
  "pushNotifications": true
}
```

---

## 6. 추천 시스템 (Recommendations)

### 6.1 개인화 추천 콘텐츠
```http
GET /api/v1/recommendations/content?limit=20&type=mixed
Authorization: Bearer <access_token>
```

**쿼리 파라미터:**
- `limit`: 추천 항목 수 (기본값: 20, 최대: 50)
- `type`: 추천 타입 (mixed, trending, similar, new)
- `refresh`: 추천 새로고침 여부

**응답:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "content": {
          "id": "1",
          "title": "[MV] 新時代",
          "thumbnail": "https://img.youtube.com/vi/SeXBiXcEBkY/hqdefault.jpg",
          "creator": {
            "id": "1",
            "name": "Ado"
          }
        },
        "score": 0.95,
        "reason": "좋아요를 누른 비슷한 영상을 기반으로 추천",
        "algorithms": ["collaborative_filtering", "content_based"]
      }
    ],
    "metadata": {
      "algorithmsUsed": ["collaborative_filtering", "content_based", "trending"],
      "generatedAt": "2024-01-01T00:00:00Z",
      "refreshInterval": 3600,
      "userProfileVersion": "1.0.2"
    }
  }
}
```

### 6.2 추천 크리에이터
```http
GET /api/v1/recommendations/creators?limit=10
Authorization: Bearer <access_token>
```

### 6.3 트렌딩 콘텐츠
```http
GET /api/v1/recommendations/trending?limit=20&timeframe=24h
Authorization: Bearer <access_token>
```

### 6.4 추천 피드백
```http
POST /api/v1/recommendations/feedback
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "contentId": "1",
  "action": "clicked" | "liked" | "dismissed" | "not_interested",
  "rating": 4.5,
  "feedback": "좋은 추천이었습니다"
}
```

---

## 7. 관리자 (Admin)

### 7.1 대시보드 통계
```http
GET /api/v1/admin/dashboard
Authorization: Bearer <admin_token>
```

**응답:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 125000,
      "activeUsers": 85000,
      "totalCreators": 1250,
      "totalContent": 450000
    },
    "userStats": {
      "totalUsers": 125000,
      "newUsersToday": 150,
      "newUsersThisWeek": 1050,
      "activeUsersToday": 12000,
      "usersByStatus": {
        "active": 120000,
        "inactive": 4500,
        "suspended": 500
      }
    },
    "creatorStats": {
      "totalCreators": 1250,
      "pendingApplications": 45,
      "approvedToday": 5,
      "rejectedToday": 2
    },
    "contentStats": {
      "totalContent": 450000,
      "newContentToday": 2500,
      "totalViews": 2500000000,
      "averageEngagement": 7.2
    }
  }
}
```

### 7.2 사용자 관리 - 목록 조회
```http
GET /api/v1/admin/users?page=1&limit=50&status=active&search=김철수
Authorization: Bearer <admin_token>
```

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "김철수",
      "email": "user@example.com",
      "role": "user",
      "serviceStatus": "active",
      "userType": "user",
      "lastLoginAt": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "statistics": {
        "contentViews": 1250,
        "subscriptions": 25,
        "bookmarks": 150
      },
      "youtubeConnection": {
        "isConnected": true,
        "channelId": "UCTest123",
        "subscriberCount": 1000,
        "syncStatus": "active"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125000,
    "totalPages": 2500
  }
}
```

### 7.3 사용자 상세 조회
```http
GET /api/v1/admin/users/:id
Authorization: Bearer <admin_token>
```

### 7.4 사용자 정보 수정
```http
PUT /api/v1/admin/users/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "김철수",
  "email": "user@example.com",
  "role": "premium",
  "serviceStatus": "active",
  "userType": "creator"
}
```

### 7.5 사용자 삭제
```http
DELETE /api/v1/admin/users/:id
Authorization: Bearer <admin_token>
```

### 7.6 일괄 작업 실행
```http
POST /api/v1/admin/users/bulk-action
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "action": "activate" | "suspend" | "delete",
  "userIds": ["1", "2", "3", "4", "5"],
  "reason": "스팸 활동 감지"
}
```

### 7.7 크리에이터 신청 목록
```http
GET /api/v1/admin/creator-applications?page=1&limit=20&status=pending
Authorization: Bearer <admin_token>
```

### 7.8 크리에이터 신청 승인
```http
POST /api/v1/admin/creator-applications/:id/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reviewComment": "채널 품질이 우수합니다."
}
```

### 7.9 크리에이터 신청 거부
```http
POST /api/v1/admin/creator-applications/:id/reject
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "insufficient_subscribers",
  "reviewComment": "구독자 수가 기준에 미달됩니다."
}
```

### 7.10 크리에이터 승인 내역
```http
GET /api/v1/admin/creator-applications/history?page=1&limit=20
Authorization: Bearer <admin_token>
```

---

## 8. 분석 (Analytics)

### 8.1 사용자 분석 데이터
```http
GET /api/v1/analytics/users/:userId?timeframe=30d
Authorization: Bearer <access_token>
```

### 8.2 크리에이터 분석 데이터
```http
GET /api/v1/analytics/creators/:creatorId?timeframe=30d
Authorization: Bearer <access_token>
```

### 8.3 콘텐츠 분석 데이터
```http
GET /api/v1/analytics/content/:contentId
Authorization: Bearer <access_token>
```

### 8.4 플랫폼 통계
```http
GET /api/v1/analytics/platforms?timeframe=7d
Authorization: Bearer <admin_token>
```

---

## 📊 데이터 모델

### User (사용자)
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin' | 'premium';
  serviceStatus: 'active' | 'inactive' | 'suspended';
  userType: 'user' | 'creator';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // 확장 정보
  preferences: UserPreferences;
  statistics: UserStatistics;
  youtubeConnection?: YouTubeConnection;
}

interface UserPreferences {
  categories: string[];
  notifications: NotificationSettings;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
}

interface UserStatistics {
  contentViews: number;
  subscriptions: number;
  bookmarks: number;
  dailyUsage: Record<string, number>;
  monthlyUsage: Record<string, number>;
}

interface YouTubeConnection {
  isConnected: boolean;
  channelId?: string;
  subscriberCount?: number;
  syncStatus: 'active' | 'error' | 'disabled';
  lastSyncAt?: Date;
  syncErrors?: string[];
}
```

### Creator (크리에이터)
```typescript
interface Creator {
  id: string;
  name: string;
  displayName: string;
  avatar?: string;
  description?: string;
  isVerified: boolean;
  followerCount: number;
  contentCount: number;
  totalViews: number;
  platforms: Platform[];
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // 사용자별 정보
  isSubscribed?: boolean;
  subscriptionNotifications?: boolean;
}

interface Platform {
  type: 'youtube' | 'twitter' | 'instagram' | 'tiktok';
  platformId: string;
  url: string;
  followerCount: number;
  isActive: boolean;
  lastSyncAt?: Date;
  syncStatus: 'active' | 'error' | 'disabled';
}
```

### Content (콘텐츠)
```typescript
interface Content {
  id: string;
  type: 'youtube_video' | 'twitter_post' | 'instagram_post';
  title: string;
  description?: string;
  thumbnail: string;
  url: string;
  platform: string;
  platformId: string;
  duration?: number; // YouTube 영상용
  publishedAt: Date;
  createdAt: Date;
  
  // 관계
  creator: Creator;
  
  // 통계
  statistics: ContentStatistics;
  
  // 사용자 상호작용
  userInteraction?: UserInteraction;
  
  // 메타데이터
  metadata: ContentMetadata;
}

interface ContentStatistics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

interface UserInteraction {
  isBookmarked: boolean;
  isLiked: boolean;
  watchedAt?: Date;
  watchDuration?: number;
  rating?: number;
}

interface ContentMetadata {
  tags: string[];
  category: string;
  language: string;
  isLive: boolean;
  quality: 'sd' | 'hd' | '4k';
  ageRestriction?: boolean;
}
```

### Notification (알림)
```typescript
interface Notification {
  id: string;
  type: 'new_video' | 'live_stream' | 'creator_update' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  
  // 관련 데이터
  data?: Record<string, any>;
  
  // 액션
  actionUrl?: string;
  actionText?: string;
  
  // 설정
  priority: 'low' | 'normal' | 'high';
  expiresAt?: Date;
}

interface NotificationSettings {
  newVideo: boolean;
  liveStream: boolean;
  weeklyDigest: boolean;
  creatorUpdates: boolean;
  communityPosts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}
```

### CreatorApplication (크리에이터 신청)
```typescript
interface CreatorApplication {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Date;
  reviewedAt?: Date;
  reviewerId?: string;
  
  // 신청 데이터
  applicationData: {
    channelInfo: {
      platform: string;
      channelId: string;
      channelUrl: string;
    };
    subscriberCount: number;
    contentCategory: string;
    sampleVideos: {
      title: string;
      url: string;
      views: number;
    }[];
    description: string;
  };
  
  // 검토 정보
  reviewData?: {
    reason?: string;
    comment?: string;
    requirements?: string[];
  };
  
  // 사용자 정보
  user: {
    id: string;
    name: string;
    email: string;
  };
}
```

---

## ⚠️ 에러 처리

### HTTP 상태 코드
- `200 OK`: 성공
- `201 Created`: 생성 성공
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스 없음
- `409 Conflict`: 충돌 (중복 등)
- `422 Unprocessable Entity`: 유효성 검사 실패
- `429 Too Many Requests`: 요청 제한
- `500 Internal Server Error`: 서버 오류

### 에러 응답 형식
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 데이터가 유효하지 않습니다.",
    "details": {
      "field": "email",
      "constraints": {
        "isEmail": "올바른 이메일 형식이 아닙니다."
      }
    }
  }
}
```

### 에러 코드 목록
```typescript
enum ErrorCode {
  // 인증 관련
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  FORBIDDEN = 'FORBIDDEN',
  
  // 사용자 관련
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // 크리에이터 관련
  CREATOR_NOT_FOUND = 'CREATOR_NOT_FOUND',
  ALREADY_SUBSCRIBED = 'ALREADY_SUBSCRIBED',
  NOT_SUBSCRIBED = 'NOT_SUBSCRIBED',
  
  // 콘텐츠 관련
  CONTENT_NOT_FOUND = 'CONTENT_NOT_FOUND',
  ALREADY_BOOKMARKED = 'ALREADY_BOOKMARKED',
  NOT_BOOKMARKED = 'NOT_BOOKMARKED',
  
  // 유효성 검사
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  
  // 시스템 관련
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // 외부 API 관련
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  YOUTUBE_API_ERROR = 'YOUTUBE_API_ERROR',
  TWITTER_API_ERROR = 'TWITTER_API_ERROR'
}
```

---

## 🔌 WebSocket 이벤트

### 연결 및 인증
```typescript
// 클라이언트 연결
const socket = io('/notifications', {
  auth: {
    token: 'Bearer <access_token>'
  }
});

// 서버 응답
socket.on('connected', (data) => {
  console.log('연결됨:', data.userId);
});
```

### 실시간 알림
```typescript
// 새 알림 수신
socket.on('new-notification', (notification) => {
  console.log('새 알림:', notification);
});

// 읽지 않은 알림 수 업데이트
socket.on('unread-count-updated', (data) => {
  console.log('읽지 않은 알림 수:', data.count);
});
```

### 실시간 업데이트
```typescript
// 새 콘텐츠 알림
socket.on('new-content', (content) => {
  console.log('새 콘텐츠:', content);
});

// 라이브 스트림 시작
socket.on('live-stream-started', (stream) => {
  console.log('라이브 시작:', stream);
});

// 크리에이터 상태 변경
socket.on('creator-status-changed', (data) => {
  console.log('크리에이터 상태 변경:', data);
});
```

### 커뮤니티 이벤트
```typescript
// 채팅 메시지
socket.on('chat-message', (message) => {
  console.log('채팅:', message);
});

// 워치 파티 이벤트
socket.on('watch-party-update', (event) => {
  console.log('워치 파티 업데이트:', event);
});
```

---

## 🌐 외부 API 통합

### YouTube Data API v3

#### 채널 정보 동기화
```http
GET https://www.googleapis.com/youtube/v3/channels
?part=snippet,statistics,brandingSettings
&id={channelId}
&key={apiKey}
```

#### 영상 목록 조회
```http
GET https://www.googleapis.com/youtube/v3/search
?part=snippet
&channelId={channelId}
&type=video
&order=date
&maxResults=50
&key={apiKey}
```

#### 영상 상세 정보
```http
GET https://www.googleapis.com/youtube/v3/videos
?part=snippet,statistics,contentDetails
&id={videoId}
&key={apiKey}
```

### Twitter API v2

#### 사용자 정보 조회
```http
GET https://api.twitter.com/2/users/by/username/{username}
?user.fields=description,public_metrics,profile_image_url
```

#### 트윗 목록 조회
```http
GET https://api.twitter.com/2/users/{id}/tweets
?tweet.fields=created_at,public_metrics,attachments
&max_results=100
```

### Instagram Basic Display API

#### 사용자 정보
```http
GET https://graph.instagram.com/me
?fields=id,username,media_count,account_type
&access_token={token}
```

#### 미디어 목록
```http
GET https://graph.instagram.com/me/media
?fields=id,caption,media_type,media_url,thumbnail_url,timestamp
&access_token={token}
```

---

## 📈 성능 및 최적화

### 캐싱 전략
```typescript
// Redis 캐시 키 설계
interface CacheKeys {
  user: `user:${userId}`;
  creator: `creator:${creatorId}`;
  content: `content:${contentId}`;
  feed: `feed:${userId}:${page}`;
  recommendations: `rec:${userId}:${type}`;
  notifications: `notif:${userId}:unread`;
  stats: `stats:${type}:${id}:${timeframe}`;
}

// TTL 설정
interface CacheTTL {
  user: 3600;           // 1시간
  creator: 1800;        // 30분
  content: 900;         // 15분
  feed: 300;            // 5분
  recommendations: 3600; // 1시간
  notifications: 60;     // 1분
  stats: 7200;          // 2시간
}
```

### 페이지네이션
```typescript
interface PaginationParams {
  page: number;      // 페이지 번호 (1부터 시작)
  limit: number;     // 페이지당 항목 수 (기본: 20, 최대: 100)
  sort?: string;     // 정렬 필드
  order?: 'asc' | 'desc'; // 정렬 순서
}

interface PaginationResponse {
  page: number;
  limit: number;
  total: number;      // 전체 항목 수
  totalPages: number; // 전체 페이지 수
  hasNext: boolean;   // 다음 페이지 존재 여부
  hasPrev: boolean;   // 이전 페이지 존재 여부
}
```

### Rate Limiting
```typescript
interface RateLimits {
  // 인증된 사용자
  authenticated: {
    requests: 1000;    // 시간당 요청 수
    window: 3600;      // 1시간 (초)
  };
  
  // 비인증 사용자
  anonymous: {
    requests: 100;     // 시간당 요청 수
    window: 3600;      // 1시간 (초)
  };
  
  // 관리자
  admin: {
    requests: 5000;    // 시간당 요청 수
    window: 3600;      // 1시간 (초)
  };
  
  // 외부 API 호출
  externalApi: {
    youtube: {
      requests: 10000; // 일일 할당량
      window: 86400;   // 24시간 (초)
    };
    twitter: {
      requests: 2000;  // 15분당 요청 수
      window: 900;     // 15분 (초)
    };
  };
}
```

---

## 🚀 배포 및 환경 설정

### 환경 변수
```bash
# 기본 설정
NODE_ENV=production
PORT=4000
API_VERSION=v1

# 데이터베이스
DATABASE_URL=postgresql://user:pass@localhost:5432/mypick
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=3600
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=604800

# 외부 API
YOUTUBE_API_KEY=your_youtube_api_key
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# 파일 스토리지
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your_s3_bucket

# 모니터링
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW=3600000
RATE_LIMIT_MAX_REQUESTS=1000
```

### Docker 실행
```bash
# 개발 환경
docker-compose up -d

# 프로덕션 환경
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📝 API 사용 예시

### 완전한 사용자 플로우 예시
```typescript
// 1. 회원가입
const registerResponse = await fetch('/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '김철수',
    email: 'user@example.com',
    password: 'password123',
    confirmPassword: 'password123',
    acceptTerms: true
  })
});

// 2. 로그인
const loginResponse = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { data } = await loginResponse.json();
const token = data.tokens.accessToken;

// 3. 크리에이터 구독
await fetch('/api/v1/creators/1/subscribe', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// 4. 개인화 피드 조회
const feedResponse = await fetch('/api/v1/content?page=1&limit=20', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 5. 콘텐츠 북마크
await fetch('/api/v1/content/1/bookmark', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// 6. 실시간 알림 연결
const socket = io('/notifications', {
  auth: { token: `Bearer ${token}` }
});

socket.on('new-notification', (notification) => {
  console.log('새 알림:', notification);
});
```

---

이 API 명세서는 mypick-client의 mock API 구조를 기반으로 실제 서버 구현에 필요한 모든 엔드포인트와 데이터 구조를 정의합니다. NestJS 프레임워크를 사용한 구현 시 이 명세를 참조하여 개발을 진행할 수 있습니다.