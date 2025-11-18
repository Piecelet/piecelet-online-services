# NeoDB API 通用代理使用指南

这是一个**通用代理**，可以转发所有 NeoDB API 请求到用户对应的实例。

## 🔄 架构流程

```
客户端
  ↓ [JWT]
apps/wrapped (/api/neodb/*)
  ↓ [JWT]
apps/api (/api/auth/neodb/api/*)
  ↓ [从数据库获取 instance + token]
  ↓ [NeoDB Access Token]
NeoDB Instance (https://{instance}/api/*)
```

## 🎯 路径映射

### apps/wrapped 层
```
客户端请求: GET /api/neodb/me/shelf?category=complete

转发到: GET {API_URL}/api/auth/neodb/api/me/shelf?category=complete
携带: Authorization: Bearer {JWT}
```

### apps/api 层
```
收到请求: GET /api/auth/neodb/api/me/shelf?category=complete
JWT: {user_id}

1. 验证 JWT → 获取 user_id
2. 查询数据库 → 获取 instance, accessToken
3. 转发到: GET https://{instance}/api/me/shelf?category=complete
   携带: Authorization: Bearer {accessToken}
```

## 📝 使用方法

### 1. 获取 JWT Token

```typescript
// 从 apps/api 获取 JWT
const response = await fetch('http://localhost:8787/api/auth/token', {
  credentials: 'include',
});

const { token } = await response.json();
```

### 2. 调用任何 NeoDB API

客户端只需：
- 将 `https://neodb.social/api/*` 替换为 `http://localhost:8788/api/neodb/*`
- 添加 JWT header

**NeoDB 原始 API:**
```bash
GET https://neodb.social/api/me/shelf?category=complete
Authorization: Bearer {neodb_token}
```

**通过代理调用:**
```bash
GET http://localhost:8788/api/neodb/me/shelf?category=complete
Authorization: Bearer {jwt}
```

## 🔥 完整示例

### TypeScript/JavaScript

```typescript
class NeoDBClient {
  constructor(
    private wrappedUrl: string,
    private jwt: string
  ) {}

  private async request(path: string, options?: RequestInit) {
    // 直接映射 NeoDB API 路径
    const url = `${this.wrappedUrl}/api/neodb${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.jwt}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // ===== GET 请求 =====

  // 获取书架
  async getShelf(category?: 'wishlist' | 'progress' | 'complete') {
    const query = category ? `?category=${category}` : '';
    return this.request(`/me/shelf${query}`);
  }

  // 获取标注
  async getMarks(year?: number, limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    if (limit) params.set('limit', String(limit));
    if (offset) params.set('offset', String(offset));

    const query = params.toString() ? `?${params}` : '';
    return this.request(`/me/marks${query}`);
  }

  // 获取单个条目
  async getItem(itemId: string) {
    return this.request(`/item/${itemId}`);
  }

  // 获取用户统计
  async getStats() {
    return this.request('/me/stats');
  }

  // 搜索
  async search(query: string, category?: string) {
    const params = new URLSearchParams({ q: query });
    if (category) params.set('category', category);

    return this.request(`/catalog/search?${params}`);
  }

  // ===== POST 请求 =====

  // 添加标注
  async createMark(itemId: string, data: { rating?: number; comment?: string; shelf_type?: string }) {
    return this.request(`/me/marks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: itemId,
        ...data
      }),
    });
  }

  // ===== PUT 请求 =====

  // 更新标注
  async updateMark(markId: string, data: { rating?: number; comment?: string }) {
    return this.request(`/me/marks/${markId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  // ===== DELETE 请求 =====

  // 删除标注
  async deleteMark(markId: string) {
    return this.request(`/me/marks/${markId}`, {
      method: 'DELETE',
    });
  }
}

// ===== 使用 =====

const client = new NeoDBClient('http://localhost:8788', jwt);

// GET: 获取想读列表
const wishlist = await client.getShelf('wishlist');

// GET: 获取 2024 年阅读记录
const marks2024 = await client.getMarks(2024);

// POST: 标记一本书为"读过"并打 5 分
await client.createMark('book_id_123', {
  rating: 5,
  comment: '很棒的书！',
  shelf_type: 'complete'
});

// PUT: 更新评分
await client.updateMark('mark_id_456', {
  rating: 4,
  comment: '重读后觉得是 4 分'
});

// DELETE: 删除标注
await client.deleteMark('mark_id_456');
```

### React 完整示例

```tsx
import { useState, useEffect } from 'react';

function useNeoDBClient(jwt: string) {
  return {
    async getMarks(year: number) {
      const response = await fetch(
        `http://localhost:8788/api/neodb/me/marks?year=${year}`,
        {
          headers: { 'Authorization': `Bearer ${jwt}` }
        }
      );
      return response.json();
    },

    async createMark(itemId: string, rating: number, comment: string) {
      const response = await fetch(
        'http://localhost:8788/api/neodb/me/marks',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            item_id: itemId,
            rating,
            comment,
            shelf_type: 'complete'
          }),
        }
      );
      return response.json();
    }
  };
}

export function ReadingWrapped() {
  const [jwt, setJwt] = useState<string>('');
  const [marks, setMarks] = useState([]);
  const client = useNeoDBClient(jwt);

  useEffect(() => {
    // 1. 获取 JWT
    fetch('http://localhost:8787/api/auth/token', {
      credentials: 'include'
    })
      .then(r => r.json())
      .then(data => setJwt(data.token));
  }, []);

  useEffect(() => {
    if (!jwt) return;

    // 2. 获取 2024 年数据
    client.getMarks(2024)
      .then(data => setMarks(data.marks || []));
  }, [jwt]);

  const handleRateBook = async (itemId: string) => {
    await client.createMark(itemId, 5, '非常喜欢！');
    // 刷新列表
    const data = await client.getMarks(2024);
    setMarks(data.marks || []);
  };

  return (
    <div>
      <h1>2024 年度阅读</h1>
      {marks.map((mark: any) => (
        <div key={mark.id}>
          <h3>{mark.item.title}</h3>
          <p>评分: {mark.rating}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🌐 支持所有 NeoDB API

理论上支持所有 NeoDB API 端点，只需要替换域名：

| NeoDB 原始 API | 代理 API |
|---------------|---------|
| `GET https://neodb.social/api/me/shelf` | `GET /api/neodb/me/shelf` |
| `GET https://neodb.social/api/me/marks` | `GET /api/neodb/me/marks` |
| `GET https://neodb.social/api/item/:id` | `GET /api/neodb/item/:id` |
| `GET https://neodb.social/api/catalog/search` | `GET /api/neodb/catalog/search` |
| `POST https://neodb.social/api/me/marks` | `POST /api/neodb/me/marks` |
| `PUT https://neodb.social/api/me/marks/:id` | `PUT /api/neodb/me/marks/:id` |
| `DELETE https://neodb.social/api/me/marks/:id` | `DELETE /api/neodb/me/marks/:id` |

**规则：**
```
https://{instance}/api/* → /api/neodb/*
```

## 🔒 安全特性

✅ **Token 永不暴露**
- NeoDB access token 只存在服务端
- 客户端只持有 JWT（可短期过期）

✅ **自动实例路由**
- 根据用户自动选择正确的 NeoDB 实例
- 支持多实例用户

✅ **完整的 HTTP 方法支持**
- GET, POST, PUT, DELETE, PATCH 全部支持
- 自动转发 request body 和 headers

✅ **透明代理**
- 完整转发 query parameters
- 完整转发 response status 和 body
- 保持 Content-Type

## ⚙️ 环境配置

### apps/wrapped

在 `wrangler.jsonc` 中配置：

```json
{
  "vars": {
    "API_URL": "http://localhost:8787"
  }
}
```

生产环境：
```json
{
  "vars": {
    "API_URL": "https://api.piecelet.app"
  }
}
```

## 🚨 错误处理

```typescript
try {
  const marks = await client.getMarks(2024);
} catch (error) {
  if (error.message.includes('401')) {
    // JWT 过期，需要重新获取
    const newJwt = await getNewJWT();
    // 重试
  } else if (error.message.includes('404')) {
    // NeoDB 账户未绑定
    window.location.href = '/login';
  } else {
    console.error('API Error:', error);
  }
}
```

## 📊 请求流程详解

```
1. 客户端
   ↓
   GET /api/neodb/me/shelf?category=complete
   Authorization: Bearer eyJhbGc...

2. apps/wrapped (JWT 认证)
   ↓ 验证 JWT ✅
   ↓
   转发到: GET http://localhost:8787/api/auth/neodb/api/me/shelf?category=complete
   Authorization: Bearer eyJhbGc...

3. apps/api (Better Auth)
   ↓ 验证 JWT → user_id: "user_123"
   ↓ 查询数据库:
      SELECT instance, accessToken
      FROM accounts
      WHERE userId='user_123' AND providerId='neodb'
   ↓ 结果: instance='neodb.social', accessToken='neodb_token_xyz'
   ↓
   转发到: GET https://neodb.social/api/me/shelf?category=complete
   Authorization: Bearer neodb_token_xyz

4. NeoDB
   ↓ 验证 access token ✅
   ↓ 返回数据

5. apps/api → apps/wrapped → 客户端
   ↓
   返回: { items: [...], count: 42 }
```

## 🎯 最佳实践

1. **JWT 管理**
   ```typescript
   // 存储在内存中，不要用 localStorage（更安全）
   let jwt: string | null = null;

   async function getJWT() {
     if (!jwt) {
       const res = await fetch('/api/auth/token', { credentials: 'include' });
       jwt = (await res.json()).token;
     }
     return jwt;
   }
   ```

2. **错误重试**
   ```typescript
   async function fetchWithRetry(url: string, options: RequestInit, retries = 1) {
     try {
       return await fetch(url, options);
     } catch (error) {
       if (retries > 0) {
         await new Promise(r => setTimeout(r, 1000));
         return fetchWithRetry(url, options, retries - 1);
       }
       throw error;
     }
   }
   ```

3. **类型安全**
   ```typescript
   interface NeoDBMark {
     id: string;
     item: {
       id: string;
       title: string;
       author: string;
     };
     rating: number;
     comment: string;
     created_at: string;
   }

   async function getMarks(year: number): Promise<NeoDBMark[]> {
     const response = await client.request(`/me/marks?year=${year}`);
     return response.marks;
   }
   ```

## 📚 参考资源

- [NeoDB API 文档](https://neodb.social/developer/)
- [Better Auth 文档](https://www.better-auth.com/)
- [Hono 文档](https://hono.dev/)
