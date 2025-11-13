import { getLocale } from '$lib/paraglide/runtime';

type Messages = {
  login_title: string;
  login_subtitle: string;
  button_continue: string;
  button_connecting: string;
  button_validating: string;
  help_no_account: string;
  link_get_started: string;
  legal_prefix: string;
  legal_terms: string;
  legal_privacy: string;
  connector_and: string;

  combobox_label_server: string;
  combobox_no_results: string;
  combobox_press_enter_to_use: string; // contains {value}
  combobox_loading: string;
  combobox_type_hint: string;
  combobox_cant_find_press_enter: string;
  combobox_helper: string;

  cb_completing_title: string;
  cb_completing_desc: string;
  cb_failed_title: string;
  cb_verify_failed: string;
  btn_try_again: string;

  dash_loading: string;
  dash_sign_out: string;
  user_placeholder: string;

  error_enter_domain: string;
  error_invalid_domain: string;
  error_domain_too_long: string;
};

const en: Messages = {
  login_title: 'Sign in to Piecelet',
  login_subtitle: 'Connect your NeoDB account to continue',
  button_continue: 'Continue',
  button_connecting: 'Connecting…',
  button_validating: 'Validating…',
  help_no_account: "Don't have a NeoDB account?",
  link_get_started: 'Get started',
  legal_prefix: 'By continuing, you agree to our',
  legal_terms: 'Terms',
  legal_privacy: 'Privacy Policy',
  connector_and: 'and',

  combobox_label_server: 'NeoDB Server',
  combobox_no_results: 'No servers found',
  combobox_press_enter_to_use: 'Press Enter to use "{value}"',
  combobox_loading: 'Loading servers…',
  combobox_type_hint: 'Type a domain to continue',
  combobox_cant_find_press_enter: "Can't find your server? Press Enter to use custom domain",
  combobox_helper: 'Select a server or enter your own NeoDB instance domain',

  cb_completing_title: 'Completing sign in…',
  cb_completing_desc: 'Please wait while we verify your authentication.',
  cb_failed_title: 'Authentication Failed',
  cb_verify_failed: 'Failed to verify authentication. Please try again.',
  btn_try_again: 'Try Again',

  dash_loading: 'Loading…',
  dash_sign_out: 'Sign Out',
  user_placeholder: 'User',

  error_enter_domain: 'Please enter a server domain',
  error_invalid_domain: 'Please enter a valid domain (e.g., neodb.social)',
  error_domain_too_long: 'Domain name is too long'
};

const zhCN: Messages = {
  login_title: '登录 Piecelet',
  login_subtitle: '连接你的 NeoDB 账户以继续',
  button_continue: '继续',
  button_connecting: '连接中…',
  button_validating: '验证中…',
  help_no_account: '还没有 NeoDB 账户？',
  link_get_started: '开始使用',
  legal_prefix: '继续操作即表示你同意我们的',
  legal_terms: '服务条款',
  legal_privacy: '隐私政策',
  connector_and: '和',

  combobox_label_server: 'NeoDB 服务器',
  combobox_no_results: '没有找到服务器',
  combobox_press_enter_to_use: '按 Enter 使用"{value}"',
  combobox_loading: '正在加载服务器…',
  combobox_type_hint: '输入域名以继续',
  combobox_cant_find_press_enter: '找不到你的服务器？按 Enter 使用自定义域名',
  combobox_helper: '选择一个服务器或输入你的 NeoDB 实例域名',

  cb_completing_title: '正在完成登录…',
  cb_completing_desc: '请稍候，我们正在验证你的身份信息。',
  cb_failed_title: '认证失败',
  cb_verify_failed: '验证登录失败，请重试。',
  btn_try_again: '重试',

  dash_loading: '加载中…',
  dash_sign_out: '退出登录',
  user_placeholder: '用户',

  error_enter_domain: '请输入服务器域名',
  error_invalid_domain: '请输入有效的域名（例如：neodb.social）',
  error_domain_too_long: '域名过长'
};

const zhTW: Messages = {
  login_title: '登入 Piecelet',
  login_subtitle: '連接你的 NeoDB 帳號以繼續',
  button_continue: '繼續',
  button_connecting: '連線中…',
  button_validating: '驗證中…',
  help_no_account: '還沒有 NeoDB 帳號？',
  link_get_started: '開始使用',
  legal_prefix: '繼續即表示你同意我們的',
  legal_terms: '服務條款',
  legal_privacy: '隱私權政策',
  connector_and: '與',

  combobox_label_server: 'NeoDB 伺服器',
  combobox_no_results: '找不到伺服器',
  combobox_press_enter_to_use: '按 Enter 使用"{value}"',
  combobox_loading: '正在載入伺服器…',
  combobox_type_hint: '輸入網域以繼續',
  combobox_cant_find_press_enter: '找不到你的伺服器？按 Enter 使用自訂網域',
  combobox_helper: '選擇伺服器或輸入你的 NeoDB 執行個體網域',

  cb_completing_title: '正在完成登入…',
  cb_completing_desc: '請稍候，我們正在驗證你的身分。',
  cb_failed_title: '驗證失敗',
  cb_verify_failed: '驗證登入失敗，請再試一次。',
  btn_try_again: '再試一次',

  dash_loading: '載入中…',
  dash_sign_out: '登出',
  user_placeholder: '使用者',

  error_enter_domain: '請輸入伺服器網域',
  error_invalid_domain: '請輸入有效的網域（例如：neodb.social）',
  error_domain_too_long: '網域過長'
};

function cur(): keyof typeof messages {
  const l = (getLocale?.() as string) || 'en';
  if (l in messages) return l as keyof typeof messages;
  // normalize variants like zh-Hant, zh-CN
  const lower = l.toLowerCase();
  if (lower.startsWith('zh')) {
    if (lower.includes('tw') || lower.includes('hk') || lower.includes('hant')) return 'zh-tw';
    return 'zh-cn';
  }
  return 'en';
}

const messages: Record<string, Messages> = {
  en,
  'zh-cn': zhCN,
  'zh-tw': zhTW
};

function interpolate(tpl: string, params: Record<string, any> = {}): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? ''));
}

export const t = {
  login_title: () => messages[cur()].login_title,
  login_subtitle: () => messages[cur()].login_subtitle,
  button_continue: () => messages[cur()].button_continue,
  button_connecting: () => messages[cur()].button_connecting,
  button_validating: () => messages[cur()].button_validating,
  help_no_account: () => messages[cur()].help_no_account,
  link_get_started: () => messages[cur()].link_get_started,
  legal_prefix: () => messages[cur()].legal_prefix,
  legal_terms: () => messages[cur()].legal_terms,
  legal_privacy: () => messages[cur()].legal_privacy,
  connector_and: () => messages[cur()].connector_and,

  combobox_label_server: () => messages[cur()].combobox_label_server,
  combobox_no_results: () => messages[cur()].combobox_no_results,
  combobox_press_enter_to_use: (value: string) => interpolate(messages[cur()].combobox_press_enter_to_use, { value }),
  combobox_loading: () => messages[cur()].combobox_loading,
  combobox_type_hint: () => messages[cur()].combobox_type_hint,
  combobox_cant_find_press_enter: () => messages[cur()].combobox_cant_find_press_enter,
  combobox_helper: () => messages[cur()].combobox_helper,

  cb_completing_title: () => messages[cur()].cb_completing_title,
  cb_completing_desc: () => messages[cur()].cb_completing_desc,
  cb_failed_title: () => messages[cur()].cb_failed_title,
  cb_verify_failed: () => messages[cur()].cb_verify_failed,
  btn_try_again: () => messages[cur()].btn_try_again,

  dash_loading: () => messages[cur()].dash_loading,
  dash_sign_out: () => messages[cur()].dash_sign_out,
  user_placeholder: () => messages[cur()].user_placeholder,

  error_enter_domain: () => messages[cur()].error_enter_domain,
  error_invalid_domain: () => messages[cur()].error_invalid_domain,
  error_domain_too_long: () => messages[cur()].error_domain_too_long
};

