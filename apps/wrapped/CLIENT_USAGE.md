# 在前端应用中使用 Wrapped Service

本文档说明如何在真实的前端应用（React, Vue, Svelte 等）中使用 Better Auth JWT 认证访问 Wrapped Service。

## 安装依赖

```bash
pnpm add better-auth
```

## 1. 创建 Auth Client

使用 Better Auth 的 `jwtClient` plugin：

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/client";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: "https://connect.piecelet.app", // 或开发环境使用 http://localhost:8787
    plugins: [
        jwtClient()
    ]
});
```

## 2. 获取 JWT Token

用户登录后，获取 JWT token：

```typescript
// 方法 1: 使用 jwtClient plugin（推荐）
const { data, error } = await authClient.token();

if (data?.token) {
    // 保存 token 到 localStorage 或状态管理
    localStorage.setItem('auth_jwt', data.token);
}

// 方法 2: 使用 getSession 并从 header 获取
const session = await authClient.getSession({
    fetchOptions: {
        onSuccess: (ctx) => {
            const jwt = ctx.response.headers.get("set-auth-jwt");
            if (jwt) {
                localStorage.setItem('auth_jwt', jwt);
            }
        }
    }
});
```

## 3. 访问 Wrapped Service

### 使用 fetch

```typescript
const token = localStorage.getItem('auth_jwt');

const response = await fetch('https://wrapped.piecelet.app/api/user', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});

const data = await response.json();
```

### 使用 Axios

```typescript
import axios from 'axios';

const wrappedClient = axios.create({
    baseURL: 'https://wrapped.piecelet.app',
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_jwt')}`
    }
});

// 使用
const { data } = await wrappedClient.get('/api/user');
```

### 使用 Interceptor 自动添加 Token

```typescript
import axios from 'axios';

const wrappedClient = axios.create({
    baseURL: 'https://wrapped.piecelet.app'
});

// 请求拦截器：自动添加 token
wrappedClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_jwt');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 响应拦截器：处理 401 错误
wrappedClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token 过期，重新获取
            const { data } = await authClient.token();
            if (data?.token) {
                localStorage.setItem('auth_jwt', data.token);
                // 重试请求
                error.config.headers.Authorization = `Bearer ${data.token}`;
                return axios.request(error.config);
            }
        }
        return Promise.reject(error);
    }
);
```

## 4. React 示例

```tsx
import { useState, useEffect } from 'react';
import { authClient } from './lib/auth-client';

function App() {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState(null);

    // 获取 JWT Token
    const getToken = async () => {
        const { data } = await authClient.token();
        if (data?.token) {
            localStorage.setItem('auth_jwt', data.token);
            setToken(data.token);
        }
    };

    // 获取用户信息
    const fetchUser = async () => {
        const token = localStorage.getItem('auth_jwt');
        if (!token) return;

        const response = await fetch('https://wrapped.piecelet.app/api/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        setUser(data.user);
    };

    useEffect(() => {
        const savedToken = localStorage.getItem('auth_jwt');
        if (savedToken) {
            setToken(savedToken);
            fetchUser();
        }
    }, []);

    return (
        <div>
            {!token ? (
                <button onClick={getToken}>获取 JWT Token</button>
            ) : (
                <>
                    <p>Token: {token.substring(0, 20)}...</p>
                    <button onClick={fetchUser}>获取用户信息</button>
                    {user && <pre>{JSON.stringify(user, null, 2)}</pre>}
                </>
            )}
        </div>
    );
}
```

## 5. API 端点

### Wrapped Service API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/user` | GET | 获取/同步用户信息 |
| `/api/wrapped` | GET | 列出所有 wrapped 数据 |
| `/api/wrapped/:year` | GET | 获取特定年份数据 |
| `/api/wrapped` | POST | 创建/更新 wrapped 数据 |

### 请求示例

```typescript
// 创建 2024 年度 wrapped 数据
const response = await fetch('https://wrapped.piecelet.app/api/wrapped', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        year: 2024,
        data: {
            totalBooks: 42,
            favoriteGenre: "科幻",
            topAuthors: ["刘慈欣", "阿西莫夫"],
            readingHours: 156
        }
    })
});

const result = await response.json();
```

## 6. 安全最佳实践

1. **Token 存储**: 使用 localStorage 或 sessionStorage，注意 XSS 风险
2. **HTTPS**: 生产环境必须使用 HTTPS
3. **Token 刷新**: JWT 过期后重新获取
4. **错误处理**: 捕获 401 错误并引导用户重新登录

## 7. 开发环境配置

```typescript
// 使用环境变量
const ACCOUNT_URL = import.meta.env.VITE_ACCOUNT_URL || 'http://localhost:8787';
const WRAPPED_URL = import.meta.env.VITE_WRAPPED_URL || 'http://localhost:8788';

export const authClient = createAuthClient({
    baseURL: ACCOUNT_URL,
    plugins: [jwtClient()]
});
```

## 调试

访问 http://localhost:8788/ 查看调试页面，测试完整的认证流程。
