/**
 * auth-guard.js
 * Shared Supabase Auth gate — same pattern used across the SLCC ecosystem
 * (slcc dashboard, pwa admin portal, match, like repos).
 *
 * All apps point at the SAME Supabase project, so one login works everywhere:
 *   Project ref : txvyplfaaisrzbwpoqcd
 *   Table prefix: slcc_
 *
 * Include supabase-js BEFORE this file:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="./auth-guard.js"></script>
 */

const SUPABASE_URL = "https://txvyplfaaisrzbwpoqcd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZgDcY0b1NGjf1iEArms2Dw_GMDlIOU5";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Resolves with the current session (or null). Renders the login/sign-up
 * form into `#auth-gate` and calls `onAuthed(session)` once a user is signed in.
 */
async function requireAuth(onAuthed) {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session) {
    hideAuthGate();
    onAuthed(session);
  } else {
    renderLoginForm(onAuthed);
  }

  supabaseClient.auth.onAuthStateChange((_event, newSession) => {
    if (newSession) {
      hideAuthGate();
      onAuthed(newSession);
    } else {
      renderLoginForm(onAuthed);
    }
  });
}

function hideAuthGate() {
  const gate = document.getElementById("auth-gate");
  if (gate) gate.style.display = "none";
  const app = document.getElementById("app");
  if (app) app.style.display = "block";
}

function renderLoginForm(onAuthed) {
  const gate = document.getElementById("auth-gate");
  const app = document.getElementById("app");
  if (app) app.style.display = "none";
  if (!gate) return;
  gate.style.display = "flex";

  gate.innerHTML = `
    <div class="auth-card">
      <h1>登入 SLCC 帳號</h1>
      <p class="auth-sub">與 slcc 儀表板 / PWA 共用同一組帳號</p>
      <input id="auth-email" type="email" placeholder="Email" autocomplete="email" />
      <input id="auth-password" type="password" placeholder="密碼" autocomplete="current-password" />
      <div id="auth-error" class="auth-error"></div>
      <button id="auth-login-btn">登入</button>
      <button id="auth-signup-btn" class="auth-secondary">註冊新帳號</button>
    </div>
  `;

  const emailEl = document.getElementById("auth-email");
  const passEl = document.getElementById("auth-password");
  const errEl = document.getElementById("auth-error");

  document.getElementById("auth-login-btn").onclick = async () => {
    errEl.textContent = "";
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: emailEl.value.trim(),
      password: passEl.value,
    });
    if (error) errEl.textContent = error.message;
  };

  document.getElementById("auth-signup-btn").onclick = async () => {
    errEl.textContent = "";
    const { error } = await supabaseClient.auth.signUp({
      email: emailEl.value.trim(),
      password: passEl.value,
    });
    if (error) {
      errEl.textContent = error.message;
    } else {
      errEl.style.color = "#2a7d46";
      errEl.textContent = "註冊成功，請查收 Email 完成驗證後登入。";
    }
  };
}

async function signOut() {
  await supabaseClient.auth.signOut();
}
