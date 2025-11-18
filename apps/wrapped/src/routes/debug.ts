import { Hono } from "hono";

const debug = new Hono();

// Debug page (default route)
debug.get("/", (c) => {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wrapped Service 调试页面</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: #f6f8fa;
        }

        h1 {
            color: #24292f;
            margin-bottom: 10px;
        }

        .subtitle {
            color: #57606a;
            margin-bottom: 30px;
        }

        .section {
            background: white;
            border: 1px solid #d0d7de;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .section h2 {
            color: #24292f;
            font-size: 18px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #d0d7de;
        }

        .form-group {
            margin-bottom: 15px;
        }

        label {
            display: block;
            font-weight: 600;
            margin-bottom: 5px;
            color: #24292f;
        }

        input, textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d0d7de;
            border-radius: 6px;
            font-size: 14px;
        }

        input:focus, textarea:focus {
            outline: none;
            border-color: #0969da;
            box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
        }

        textarea {
            font-family: 'Monaco', 'Menlo', monospace;
            min-height: 150px;
        }

        button {
            background: #0969da;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            margin-right: 10px;
            margin-bottom: 10px;
        }

        button:hover {
            background: #0860ca;
        }

        button.secondary {
            background: #6e7781;
        }

        button.secondary:hover {
            background: #57606a;
        }

        button.success {
            background: #1a7f37;
        }

        button.success:hover {
            background: #116329;
        }

        .status {
            padding: 10px;
            border-radius: 6px;
            margin-bottom: 15px;
            display: none;
        }

        .status.success {
            background: #dafbe1;
            color: #116329;
            border: 1px solid #4ac776;
        }

        .status.error {
            background: #ffebe9;
            color: #d1242f;
            border: 1px solid #ff8182;
        }

        .response {
            background: #f6f8fa;
            border: 1px solid #d0d7de;
            border-radius: 6px;
            padding: 15px;
            margin-top: 15px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 13px;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: 400px;
            overflow-y: auto;
        }

        .endpoint {
            display: flex;
            gap: 10px;
            align-items: flex-start;
            margin-bottom: 10px;
        }

        .endpoint-info {
            flex: 1;
        }

        .endpoint-method {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 8px;
        }

        .method-get {
            background: #dafbe1;
            color: #116329;
        }

        .method-post {
            background: #fff8c5;
            color: #6f4400;
        }

        code {
            background: #f6f8fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 13px;
        }

        .config {
            background: #fff8c5;
            border: 1px solid #e4c800;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 20px;
        }

        .config-label {
            font-weight: 600;
            color: #6f4400;
            margin-bottom: 5px;
        }

        .config-value {
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 13px;
            color: #24292f;
        }
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

    <!-- 步骤 1: 登录 -->
    <div class="section">
        <h2>步骤 1: 登录账户服务</h2>
        <div id="login-status" class="status"></div>

        <div class="form-group">
            <label for="email">邮箱</label>
            <input type="email" id="email" placeholder="user@example.com" value="test@example.com">
        </div>

        <div class="form-group">
            <label for="password">密码</label>
            <input type="password" id="password" placeholder="密码" value="password123">
        </div>

        <button onclick="login()">🔐 登录</button>
        <button class="secondary" onclick="loginWithNeoDB()">🌐 使用 NeoDB 登录</button>

        <div id="login-response" class="response" style="display: none;"></div>
    </div>

    <!-- 步骤 2: 测试 Wrapped API -->
    <div class="section">
        <h2>步骤 2: 测试 Wrapped API</h2>
        <p style="margin-bottom: 15px; color: #57606a;">
            Session cookie 会自动携带，无需手动管理
        </p>
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
            <textarea id="wrapped-data">{
  "year": 2024,
  "data": {
    "totalBooks": 42,
    "favoriteGenre": "科幻",
    "topAuthors": ["刘慈欣", "阿西莫夫", "特德·姜"],
    "readingHours": 156
  }
}</textarea>
        </div>
        <button class="success" onclick="createCustomWrapped()">📝 提交自定义数据</button>

        <div id="api-response" class="response" style="display: none;"></div>
    </div>

    <!-- 工具区 -->
    <div class="section">
        <h2>🛠️ 工具</h2>
        <button class="secondary" onclick="clearCookies()">🗑️ 清除所有 Cookies</button>
        <button class="secondary" onclick="clearResponses()">🧹 清空响应</button>
    </div>

    <script>
        const ACCOUNT_URL = 'http://localhost:8787';

        // 更新配置显示
        document.getElementById('account-url').textContent = ACCOUNT_URL;
        document.getElementById('wrapped-url').textContent = window.location.origin;

        function showStatus(elementId, message, isSuccess) {
            const el = document.getElementById(elementId);
            el.textContent = message;
            el.className = 'status ' + (isSuccess ? 'success' : 'error');
            el.style.display = 'block';
            setTimeout(() => {
                el.style.display = 'none';
            }, 5000);
        }

        function showResponse(elementId, data) {
            const el = document.getElementById(elementId);
            el.textContent = JSON.stringify(data, null, 2);
            el.style.display = 'block';
        }

        async function login() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch(\`\${ACCOUNT_URL}/api/auth/sign-in/email\`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    showStatus('login-status', '✅ 登录成功！', true);
                    showResponse('login-response', data);
                } else {
                    showStatus('login-status', '❌ 登录失败: ' + (data.error || response.statusText), false);
                    showResponse('login-response', data);
                }
            } catch (error) {
                showStatus('login-status', '❌ 请求失败: ' + error.message, false);
                showResponse('login-response', { error: error.message });
            }
        }

        function loginWithNeoDB() {
            const callbackURL = window.location.origin + window.location.pathname;
            const instance = prompt('请输入 NeoDB 实例域名', 'neodb.social');
            if (instance) {
                window.location.href = \`\${ACCOUNT_URL}/api/auth/neodb/start?instance=\${encodeURIComponent(instance)}&callbackURL=\${encodeURIComponent(callbackURL)}\`;
            }
        }

        async function getUser() {
            try {
                const response = await fetch('/api/user', {
                    credentials: 'include'
                });

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
                const response = await fetch('/api/wrapped', {
                    credentials: 'include'
                });

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
                const response = await fetch('/api/wrapped/2024', {
                    credentials: 'include'
                });

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
            const testData = {
                year: 2024,
                data: {
                    totalBooks: 42,
                    favoriteGenre: "科幻",
                    topAuthors: ["刘慈欣", "阿西莫夫", "特德·姜"],
                    readingHours: 156
                }
            };

            try {
                const response = await fetch('/api/wrapped', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testData)
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

                const response = await fetch('/api/wrapped', {
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
debug.get("/health", (c) => {
    return c.json({
        service: "piecelet-wrapped",
        status: "ok",
        timestamp: new Date().toISOString()
    });
});

export default debug;
