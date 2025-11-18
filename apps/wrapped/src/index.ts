import { Hono } from "hono";
import { cors } from "hono/cors";
import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import type { CloudflareBindings } from "./env";
import { jwtAuth, type AuthContext } from "./middleware/auth";
import { schema, wrappedUsers, wrappedData } from "./db";
import { nanoid } from "nanoid";

const app = new Hono<{ Bindings: CloudflareBindings; Variables: AuthContext }>();

// CORS configuration
app.use(
    "*",
    cors({
        origin: (origin) => {
            // In development, allow all origins
            // In production, only allow specific origins
            // @ts-ignore
            const isDev = typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development';
            if (isDev) {
                return origin || "*";
            }
            // Production origins
            const allowedOrigins = [
                "https://account.piecelet.app",
                "https://connect.piecelet.app",
                "https://online.piecelet.app",
                "https://services.piecelet.app",
                "https://www.piecelet.app",
                "https://piecelet.app",
            ];
            return origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
        },
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
        maxAge: 600,
        credentials: true,
    })
);

// Debug page (default route)
app.get("/", (c) => {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wrapped Service 调试页面</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #f6f8fa; }
        h1 { color: #24292f; margin-bottom: 10px; }
        .subtitle { color: #57606a; margin-bottom: 30px; }
        .section { background: white; border: 1px solid #d0d7de; border-radius: 6px; padding: 20px; margin-bottom: 20px; }
        .section h2 { color: #24292f; font-size: 18px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #d0d7de; }
        .form-group { margin-bottom: 15px; }
        label { display: block; font-weight: 600; margin-bottom: 5px; color: #24292f; }
        input, textarea { width: 100%; padding: 8px 12px; border: 1px solid #d0d7de; border-radius: 6px; font-size: 14px; }
        input:focus, textarea:focus { outline: none; border-color: #0969da; box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1); }
        textarea { font-family: Monaco, monospace; min-height: 150px; }
        button { background: #0969da; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-right: 10px; margin-bottom: 10px; }
        button:hover { background: #0860ca; }
        button.secondary { background: #6e7781; }
        button.secondary:hover { background: #57606a; }
        button.success { background: #1a7f37; }
        button.success:hover { background: #116329; }
        .status { padding: 10px; border-radius: 6px; margin-bottom: 15px; display: none; }
        .status.success { background: #dafbe1; color: #116329; border: 1px solid #4ac776; }
        .status.error { background: #ffebe9; color: #d1242f; border: 1px solid #ff8182; }
        .response { background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px; padding: 15px; margin-top: 15px; font-family: Monaco, monospace; font-size: 13px; white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto; }
        .endpoint { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; }
        .endpoint-info { flex: 1; }
        .endpoint-method { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 12px; font-weight: 600; margin-right: 8px; }
        .method-get { background: #dafbe1; color: #116329; }
        .method-post { background: #fff8c5; color: #6f4400; }
        code { background: #f6f8fa; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
        .config { background: #fff8c5; border: 1px solid #e4c800; border-radius: 6px; padding: 12px; margin-bottom: 20px; }
        .config-label { font-weight: 600; color: #6f4400; margin-bottom: 5px; }
        .config-value { font-family: Monaco, monospace; font-size: 13px; color: #24292f; }
    </style>
</head>
<body>
    <h1>🎁 Wrapped Service 调试页面</h1>
    <p class="subtitle">用于测试 JWT 认证和 Wrapped API</p>

    <div class="config">
        <div class="config-label">📍 当前配置</div>
        <div class="config-value">
            账户服务: <span id="account-url">http://localhost:8787</span><br>
            Wrapped 服务: <span id="wrapped-url">http://localhost:8788</span>
        </div>
    </div>

    <div class="section">
        <h2>步骤 1: 前往账户服务登录</h2>
        <p style="margin-bottom: 15px; color: #57606a;">
            点击下方按钮前往账户服务登录页面，登录完成后返回此页面继续操作。
        </p>
        <button onclick="goToLogin()">🔐 前往账户服务登录</button>
        <button class="secondary" onclick="checkLoginStatus()">🔍 检查登录状态</button>
        <div id="login-status" class="status"></div>
        <div id="login-response" class="response" style="display: none;"></div>
    </div>

    <div class="section">
        <h2>步骤 2: 获取 JWT Cookie</h2>
        <div id="jwt-status" class="status"></div>
        <p style="margin-bottom: 15px; color: #57606a;">将 JWT token 设置到 cookie 中，后续请求会自动携带</p>
        <button onclick="getJWTCookie()">🍪 获取 JWT Cookie</button>
        <button class="secondary" onclick="showCookies()">👀 查看 Cookies</button>
        <div id="jwt-response" class="response" style="display: none;"></div>
    </div>

    <div class="section">
        <h2>步骤 3: 测试 Wrapped API</h2>
        <div id="api-status" class="status"></div>
        <div class="endpoint">
            <div class="endpoint-info">
                <span class="endpoint-method method-get">GET</span>
                <code>/api/user</code> - 获取/同步用户信息
            </div>
            <button onclick="getUser()">测试</button>
        </div>
        <div class="endpoint">
            <div class="endpoint-info">
                <span class="endpoint-method method-get">GET</span>
                <code>/api/wrapped</code> - 列出所有 wrapped 数据
            </div>
            <button onclick="listWrapped()">测试</button>
        </div>
        <div class="endpoint">
            <div class="endpoint-info">
                <span class="endpoint-method method-get">GET</span>
                <code>/api/wrapped/2024</code> - 获取 2024 年数据
            </div>
            <button onclick="getWrapped2024()">测试</button>
        </div>
        <div class="endpoint">
            <div class="endpoint-info">
                <span class="endpoint-method method-post">POST</span>
                <code>/api/wrapped</code> - 创建/更新 wrapped 数据
            </div>
            <button onclick="createWrapped()">测试</button>
        </div>
        <div class="form-group" style="margin-top: 20px;">
            <label for="wrapped-data">自定义 Wrapped 数据 (JSON)</label>
            <textarea id="wrapped-data">{"year": 2024, "data": {"totalBooks": 42, "favoriteGenre": "科幻", "topAuthors": ["刘慈欣", "阿西莫夫"], "readingHours": 156}}</textarea>
        </div>
        <button class="success" onclick="createCustomWrapped()">📝 提交自定义数据</button>
        <div id="api-response" class="response" style="display: none;"></div>
    </div>

    <div class="section">
        <h2>🛠️ 工具</h2>
        <button class="secondary" onclick="clearCookies()">🗑️ 清除所有 Cookies</button>
        <button class="secondary" onclick="clearResponses()">🧹 清空响应</button>
    </div>

    <script>
        const ACCOUNT_URL = 'http://localhost:8787';
        const WRAPPED_URL = 'http://localhost:8788';
        document.getElementById('account-url').textContent = ACCOUNT_URL;
        document.getElementById('wrapped-url').textContent = WRAPPED_URL;

        function showStatus(elementId, message, isSuccess) {
            const el = document.getElementById(elementId);
            el.textContent = message;
            el.className = 'status ' + (isSuccess ? 'success' : 'error');
            el.style.display = 'block';
            setTimeout(() => el.style.display = 'none', 5000);
        }

        function showResponse(elementId, data) {
            const el = document.getElementById(elementId);
            el.textContent = JSON.stringify(data, null, 2);
            el.style.display = 'block';
        }

        function goToLogin() {
            // Open account service login page in new tab
            window.open(ACCOUNT_URL, '_blank');
            showStatus('login-status', '✅ 已在新标签页打开登录页面，请在该页面登录后返回此页面', true);
        }

        async function checkLoginStatus() {
            try {
                const response = await fetch(\`\${ACCOUNT_URL}/api/auth/get-session\`, {
                    credentials: 'include'
                });
                const data = await response.json();
                if (response.ok && data.session) {
                    showStatus('login-status', '✅ 已登录: ' + (data.user?.email || data.user?.name || '用户'), true);
                    showResponse('login-response', data);
                } else {
                    showStatus('login-status', '❌ 未登录，请先前往账户服务登录', false);
                    showResponse('login-response', data);
                }
            } catch (error) {
                showStatus('login-status', '❌ 检查失败: ' + error.message, false);
                showResponse('login-response', { error: error.message });
            }
        }

        async function getJWTCookie() {
            try {
                const response = await fetch(\`\${ACCOUNT_URL}/api/auth/jwt-cookie\`, { credentials: 'include' });
                const data = await response.json();
                if (response.ok) {
                    showStatus('jwt-status', '✅ JWT Cookie 设置成功！', true);
                    showResponse('jwt-response', data);
                } else {
                    showStatus('jwt-status', '❌ 获取失败: ' + (data.error || response.statusText), false);
                    showResponse('jwt-response', data);
                }
            } catch (error) {
                showStatus('jwt-status', '❌ 请求失败: ' + error.message, false);
                showResponse('jwt-response', { error: error.message });
            }
        }

        function showCookies() {
            const cookies = document.cookie.split(';').map(c => {
                const [key, value] = c.trim().split('=');
                return { key, value: value?.substring(0, 50) + (value?.length > 50 ? '...' : '') };
            });
            showResponse('jwt-response', { cookies });
        }

        async function getUser() {
            try {
                const response = await fetch(\`\${WRAPPED_URL}/api/user\`, { credentials: 'include' });
                const data = await response.json();
                if (response.ok) {
                    showStatus('api-status', '✅ 获取用户信息成功！', true);
                    showResponse('api-response', data);
                } else {
                    showStatus('api-status', '❌ 请求失败: ' + (data.error || response.statusText), false);
                    showResponse('api-response', data);
                }
            } catch (error) {
                showStatus('api-status', '❌ 请求失败: ' + error.message, false);
                showResponse('api-response', { error: error.message });
            }
        }

        async function listWrapped() {
            try {
                const response = await fetch(\`\${WRAPPED_URL}/api/wrapped\`, { credentials: 'include' });
                const data = await response.json();
                if (response.ok) {
                    showStatus('api-status', '✅ 获取列表成功！', true);
                    showResponse('api-response', data);
                } else {
                    showStatus('api-status', '❌ 请求失败: ' + (data.error || response.statusText), false);
                    showResponse('api-response', data);
                }
            } catch (error) {
                showStatus('api-status', '❌ 请求失败: ' + error.message, false);
                showResponse('api-response', { error: error.message });
            }
        }

        async function getWrapped2024() {
            try {
                const response = await fetch(\`\${WRAPPED_URL}/api/wrapped/2024\`, { credentials: 'include' });
                const data = await response.json();
                if (response.ok) {
                    showStatus('api-status', '✅ 获取 2024 数据成功！', true);
                    showResponse('api-response', data);
                } else {
                    showStatus('api-status', '❌ 请求失败: ' + (data.error || response.statusText), false);
                    showResponse('api-response', data);
                }
            } catch (error) {
                showStatus('api-status', '❌ 请求失败: ' + error.message, false);
                showResponse('api-response', { error: error.message });
            }
        }

        async function createWrapped() {
            try {
                const response = await fetch(\`\${WRAPPED_URL}/api/wrapped\`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ year: 2024, data: { totalBooks: 42, favoriteGenre: "科幻", topAuthors: ["刘慈欣", "阿西莫夫"], readingHours: 156 } })
                });
                const data = await response.json();
                if (response.ok) {
                    showStatus('api-status', '✅ 创建/更新成功！', true);
                    showResponse('api-response', data);
                } else {
                    showStatus('api-status', '❌ 请求失败: ' + (data.error || response.statusText), false);
                    showResponse('api-response', data);
                }
            } catch (error) {
                showStatus('api-status', '❌ 请求失败: ' + error.message, false);
                showResponse('api-response', { error: error.message });
            }
        }

        async function createCustomWrapped() {
            try {
                const customData = JSON.parse(document.getElementById('wrapped-data').value);
                const response = await fetch(\`\${WRAPPED_URL}/api/wrapped\`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(customData)
                });
                const data = await response.json();
                if (response.ok) {
                    showStatus('api-status', '✅ 提交成功！', true);
                    showResponse('api-response', data);
                } else {
                    showStatus('api-status', '❌ 请求失败: ' + (data.error || response.statusText), false);
                    showResponse('api-response', data);
                }
            } catch (error) {
                showStatus('api-status', '❌ 请求失败: ' + error.message, false);
                showResponse('api-response', { error: error.message });
            }
        }

        function clearCookies() {
            document.cookie.split(";").forEach(c => {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            alert('✅ Cookies 已清除！');
        }

        function clearResponses() {
            ['login-response', 'jwt-response', 'api-response'].forEach(id => {
                document.getElementById(id).style.display = 'none';
            });
        }
    </script>
</body>
</html>`;
    return c.html(html);
});

// Health check
app.get("/health", (c) => {
    return c.json({
        service: "piecelet-wrapped",
        status: "ok",
        timestamp: new Date().toISOString()
    });
});

// Get or sync user information from JWT
app.get("/api/user", jwtAuth, async (c) => {
    const user = c.get("user");
    const db = drizzle(c.env.WRAPPED_DB, { schema });

    try {
        // Check if user exists
        const existingUser = await db
            .select()
            .from(wrappedUsers)
            .where(eq(wrappedUsers.id, user.sub))
            .get();

        if (existingUser) {
            // Update user information
            const updated = await db
                .update(wrappedUsers)
                .set({
                    email: user.email || existingUser.email,
                    name: user.name || existingUser.name,
                    username: user.username || existingUser.username,
                    updatedAt: new Date(),
                })
                .where(eq(wrappedUsers.id, user.sub))
                .returning()
                .get();

            return c.json({ user: updated });
        } else {
            // Create new user
            const newUser = await db
                .insert(wrappedUsers)
                .values({
                    id: user.sub,
                    email: user.email || "",
                    name: user.name,
                    username: user.username,
                })
                .returning()
                .get();

            return c.json({ user: newUser });
        }
    } catch (error) {
        console.error("Error syncing user:", error);
        return c.json(
            { error: "Failed to sync user information" },
            500
        );
    }
});

// Get wrapped data for a specific year
app.get("/api/wrapped/:year", jwtAuth, async (c) => {
    const user = c.get("user");
    const year = parseInt(c.req.param("year"));
    const db = drizzle(c.env.WRAPPED_DB, { schema });

    if (isNaN(year)) {
        return c.json({ error: "Invalid year parameter" }, 400);
    }

    try {
        const wrapped = await db
            .select()
            .from(wrappedData)
            .where(
                and(
                    eq(wrappedData.userId, user.sub),
                    eq(wrappedData.year, year)
                )
            )
            .get();

        if (!wrapped) {
            return c.json({ error: "Wrapped data not found for this year" }, 404);
        }

        return c.json({ wrapped });
    } catch (error) {
        console.error("Error fetching wrapped data:", error);
        return c.json({ error: "Failed to fetch wrapped data" }, 500);
    }
});

// Create or update wrapped data
app.post("/api/wrapped", jwtAuth, async (c) => {
    const user = c.get("user");
    const db = drizzle(c.env.WRAPPED_DB, { schema });

    try {
        const body = await c.req.json();
        const { year, data } = body;

        if (!year || !data) {
            return c.json({ error: "Year and data are required" }, 400);
        }

        // Ensure user exists
        let existingUser = await db
            .select()
            .from(wrappedUsers)
            .where(eq(wrappedUsers.id, user.sub))
            .get();

        if (!existingUser) {
            existingUser = await db
                .insert(wrappedUsers)
                .values({
                    id: user.sub,
                    email: user.email || "",
                    name: user.name,
                    username: user.username,
                })
                .returning()
                .get();
        }

        // Check if wrapped data already exists for this year
        const existing = await db
            .select()
            .from(wrappedData)
            .where(
                and(
                    eq(wrappedData.userId, user.sub),
                    eq(wrappedData.year, year)
                )
            )
            .get();

        if (existing) {
            // Update existing wrapped data
            const updated = await db
                .update(wrappedData)
                .set({
                    data,
                    updatedAt: new Date(),
                })
                .where(eq(wrappedData.id, existing.id))
                .returning()
                .get();

            return c.json({ wrapped: updated });
        } else {
            // Create new wrapped data
            const newWrapped = await db
                .insert(wrappedData)
                .values({
                    id: nanoid(),
                    userId: user.sub,
                    year,
                    data,
                })
                .returning()
                .get();

            return c.json({ wrapped: newWrapped });
        }
    } catch (error) {
        console.error("Error saving wrapped data:", error);
        return c.json(
            { error: "Failed to save wrapped data" },
            500
        );
    }
});

// List all wrapped years for the user
app.get("/api/wrapped", jwtAuth, async (c) => {
    const user = c.get("user");
    const db = drizzle(c.env.WRAPPED_DB, { schema });

    try {
        const wrappedList = await db
            .select()
            .from(wrappedData)
            .where(eq(wrappedData.userId, user.sub))
            .all();

        return c.json({ wrapped: wrappedList });
    } catch (error) {
        console.error("Error fetching wrapped list:", error);
        return c.json({ error: "Failed to fetch wrapped data" }, 500);
    }
});

export default app;
