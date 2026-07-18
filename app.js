/* ============================================================
   12星座 × 大五人格 × 荣格色彩 — 居家保全付费特征测试 App
   逻辑说明：
   - 荣格色彩（红/蓝/黄/绿）：8 题强制选择小测验，得出使用者主色
   - 大五人格：BFI-10 简版量表，每一维度 2 题（含反向计分）
   - 星座：由生日自动判断，或手动选择
   - 结果：查表组合出 5 大人格维度对应的居家养老需求／付费意愿／
     价格敏感度／溢价接受度／核心付费偏好建议，并附上星座本身的
     消费与居家安全需求特征。
   ============================================================ */

const state = {
  step: 0,
  gender: null,       // 'M' | 'F'
  birthMonth: null,
  birthDay: null,
  zodiac: null,
  colorAnswers: Array(COLOR_QUIZ.length).fill(null),
  bfiAnswers: Array(BFI10_ITEMS.length).fill(null),
  result: null,
  session: null,
};

const STEPS = ["intro", "profile", "colorQuiz", "bfiTest", "result"];

function el(id) { return document.getElementById(id); }

function render() {
  const root = el("app-root");
  root.innerHTML = "";
  root.appendChild(renderProgress());

  switch (STEPS[state.step]) {
    case "intro": root.appendChild(renderIntro()); break;
    case "profile": root.appendChild(renderProfileStep()); break;
    case "colorQuiz": root.appendChild(renderColorQuiz()); break;
    case "bfiTest": root.appendChild(renderBfiTest()); break;
    case "result": root.appendChild(renderResult()); break;
  }
}

function renderProgress() {
  const wrap = document.createElement("div");
  if (STEPS[state.step] === "intro" || STEPS[state.step] === "result") return wrap;
  wrap.className = "progress";
  const total = STEPS.length - 2; // exclude intro & result
  const currentIdx = state.step - 1;
  for (let i = 0; i < total; i++) {
    const s = document.createElement("span");
    if (i <= currentIdx) s.classList.add("done");
    wrap.appendChild(s);
  }
  return wrap;
}

/* ---------------- Step 0: Intro ---------------- */
function renderIntro() {
  const c = document.createElement("div");
  c.className = "card";
  c.innerHTML = `
    <h2 class="step-title">12星座 × 大五人格 × 荣格色彩</h2>
    <p class="text-block">这份测试结合<b>荣格性格色彩</b>、<b>BFI-10 大五人格量表</b>与<b>星座特质</b>，
    为你生成一份专属的「居家保全付费特征」画像：包含居家养老需求、付费意愿、价格敏感度、
    溢价接受度，以及最适合你的安防服务建议。</p>
    <p class="text-block">全程约 3 分钟，共 3 个小步骤。</p>
    <div class="nav-row" style="justify-content:flex-end">
      <button class="btn btn-primary" id="start-btn">开始测试</button>
    </div>
  `;
  c.querySelector("#start-btn").onclick = () => { state.step = 1; render(); };
  return c;
}

/* ---------------- Step 1: gender + zodiac ---------------- */
function renderProfileStep() {
  const c = document.createElement("div");
  c.className = "card";
  c.innerHTML = `
    <h2 class="step-title">基本资料</h2>
    <div class="field">
      <label>性别</label>
      <div class="gender-row">
        <button data-g="M" class="${state.gender === "M" ? "selected" : ""}">男</button>
        <button data-g="F" class="${state.gender === "F" ? "selected" : ""}">女</button>
      </div>
    </div>
    <div class="field">
      <label>生日（用于自动判断星座，也可以直接手动选择星座）</label>
      <input type="date" id="birth-date" />
    </div>
    <div class="field">
      <label>星座</label>
      <select id="zodiac-select">
        <option value="">请选择星座</option>
        ${ZODIAC_ORDER.map(z => `<option value="${z}" ${state.zodiac===z?"selected":""}>${ZODIAC_EMOJI[z]} ${z}（${ZODIAC_DATA.zodiac[z].range}）</option>`).join("")}
      </select>
      <div class="zodiac-hint" id="zodiac-hint">${state.zodiac ? "已选择：" + state.zodiac : ""}</div>
    </div>
    <div class="nav-row">
      <button class="btn btn-ghost" id="back-btn">上一步</button>
      <button class="btn btn-primary" id="next-btn" ${(!state.gender || !state.zodiac) ? "disabled" : ""}>下一步</button>
    </div>
  `;

  c.querySelectorAll(".gender-row button").forEach(btn => {
    btn.onclick = () => { state.gender = btn.dataset.g; render(); };
  });

  const dateInput = c.querySelector("#birth-date");
  dateInput.onchange = () => {
    const d = new Date(dateInput.value);
    if (!isNaN(d)) {
      state.birthMonth = d.getMonth() + 1;
      state.birthDay = d.getDate();
      state.zodiac = zodiacFromDate(state.birthMonth, state.birthDay);
      render();
    }
  };

  const zodiacSelect = c.querySelector("#zodiac-select");
  zodiacSelect.onchange = () => { state.zodiac = zodiacSelect.value || null; render(); };

  c.querySelector("#back-btn").onclick = () => { state.step = 0; render(); };
  c.querySelector("#next-btn").onclick = () => { if (state.gender && state.zodiac) { state.step = 2; render(); } };

  return c;
}

/* ---------------- Step 2: color quiz ---------------- */
function renderColorQuiz() {
  const c = document.createElement("div");
  c.className = "card";
  const answeredAll = state.colorAnswers.every(a => a !== null);

  let html = `<h2 class="step-title">荣格性格色彩测验</h2>
  <p class="text-block">请依直觉选出最贴近你的选项，没有对错之分。</p>`;

  COLOR_QUIZ.forEach((item, qi) => {
    html += `<div class="quiz-q">
      <p class="q-text">${qi + 1}. ${item.q}</p>
      ${item.options.map((opt, oi) => `
        <button class="opt ${state.colorAnswers[qi] === oi ? "selected" : ""}" data-qi="${qi}" data-oi="${oi}">
          ${opt.t}
        </button>`).join("")}
    </div>`;
  });

  html += `<div class="nav-row">
    <button class="btn btn-ghost" id="back-btn">上一步</button>
    <button class="btn btn-primary" id="next-btn" ${answeredAll ? "" : "disabled"}>下一步</button>
  </div>`;

  c.innerHTML = html;

  c.querySelectorAll(".opt").forEach(btn => {
    btn.onclick = () => {
      state.colorAnswers[Number(btn.dataset.qi)] = Number(btn.dataset.oi);
      render();
    };
  });

  c.querySelector("#back-btn").onclick = () => { state.step = 1; render(); };
  c.querySelector("#next-btn").onclick = () => {
    if (state.colorAnswers.every(a => a !== null)) { state.step = 3; render(); }
  };

  return c;
}

/* ---------------- Step 3: BFI-10 ---------------- */
function renderBfiTest() {
  const c = document.createElement("div");
  c.className = "card";
  const answeredAll = state.bfiAnswers.every(a => a !== null);

  let html = `<h2 class="step-title">大五人格测试（BFI-10）</h2>
  <p class="text-block">我认为自己是这样的人 —— 请选择你的同意程度。</p>`;

  BFI10_ITEMS.forEach((item, qi) => {
    html += `<div class="quiz-q">
      <p class="q-text">${qi + 1}. ${item.text}</p>
      <div class="likert">
        ${BFI10_SCALE.map((label, li) => `
          <button class="opt-likert ${state.bfiAnswers[qi] === li + 1 ? "selected" : ""}" data-qi="${qi}" data-v="${li + 1}">
            ${label}
          </button>`).join("")}
      </div>
    </div>`;
  });

  html += `<div class="nav-row">
    <button class="btn btn-ghost" id="back-btn">上一步</button>
    <button class="btn btn-primary" id="submit-btn" ${answeredAll ? "" : "disabled"}>查看我的画像</button>
  </div>`;

  c.innerHTML = html;

  c.querySelectorAll(".opt-likert").forEach(btn => {
    btn.onclick = () => {
      state.bfiAnswers[Number(btn.dataset.qi)] = Number(btn.dataset.v);
      render();
    };
  });

  c.querySelector("#back-btn").onclick = () => { state.step = 2; render(); };
  c.querySelector("#submit-btn").onclick = async () => {
    if (state.bfiAnswers.every(a => a !== null)) {
      state.result = computeProfile();
      await saveProfile(state.result);
      state.step = 4;
      render();
    }
  };

  return c;
}

/* ---------------- Scoring ---------------- */
function scoreColor() {
  const tally = { "红色": 0, "蓝色": 0, "黄色": 0, "绿色": 0 };
  state.colorAnswers.forEach((oi, qi) => {
    const c = COLOR_QUIZ[qi].options[oi].c;
    tally[c]++;
  });
  const priority = ["红色", "黄色", "蓝色", "绿色"];
  let best = priority[0];
  priority.forEach(c => { if (tally[c] > tally[best]) best = c; });
  return { tally, dominant: best };
}

function scoreBfi() {
  const raw = {};
  BFI10_ITEMS.forEach((item, qi) => {
    const ans = state.bfiAnswers[qi];
    const score = item.rev ? (6 - ans) : ans;
    raw[item.dim] = (raw[item.dim] || 0) + score;
  });
  // raw per dim: sum of 2 items, range 2-10, midpoint 6
  const dims = {};
  Object.keys(raw).forEach(dim => {
    const score = raw[dim];
    dims[dim] = {
      score,
      pct: Math.round(((score - 2) / 8) * 100),
      level: score > 6 ? "H" : "L",
    };
  });
  return dims;
}

function findPricing(color, traitCn, level) {
  const row = ZODIAC_DATA.pricing.find(r => r[0] === color && r[1] === traitCn && r[2] === level);
  return row ? { will: row[3], sens: row[4], prem: row[5] } : null;
}

function computeProfile() {
  const colorResult = scoreColor();
  const bfiResult = scoreBfi();
  const color = colorResult.dominant;
  const zodiac = state.zodiac;

  const dimKeyToCn = { O: "开放性", C: "尽责性", E: "外倾性", A: "宜人性", N: "神经质" };

  const traits = Object.keys(bfiResult).map(dimKey => {
    const traitCn = dimKeyToCn[dimKey];
    const level = bfiResult[dimKey].level;
    const traitLevelKey = traitCn + level;
    const pricing = findPricing(color, traitCn, level);
    const corePref = [
      ZODIAC_DATA.colorBase[color],
      ZODIAC_DATA.traitPhrase[traitLevelKey],
      ZODIAC_DATA.zShort[zodiac],
    ].join("、");
    return {
      dimKey,
      traitCn,
      level,
      score: bfiResult[dimKey].score,
      pct: bfiResult[dimKey].pct,
      need: ZODIAC_DATA.needs[traitLevelKey],
      pricing,
      corePref,
      extremity: Math.abs(bfiResult[dimKey].score - 6), // distance from midpoint = how defining this trait is
    };
  });

  // dominant trait = most extreme (farthest from midpoint), tie -> first by definition order O,C,E,A,N
  const order = ["O", "C", "E", "A", "N"];
  let dominantTrait = traits[0];
  traits.forEach(t => {
    if (t.extremity > dominantTrait.extremity) dominantTrait = t;
    else if (t.extremity === dominantTrait.extremity && order.indexOf(t.dimKey) < order.indexOf(dominantTrait.dimKey)) {
      dominantTrait = t;
    }
  });

  // Overall willingness = majority vote across 5 traits (fallback to dominant trait's value)
  const willCount = {};
  traits.forEach(t => { willCount[t.pricing.will] = (willCount[t.pricing.will] || 0) + 1; });
  let overallWill = dominantTrait.pricing.will;
  let bestCount = -1;
  Object.keys(willCount).forEach(k => { if (willCount[k] > bestCount) { bestCount = willCount[k]; overallWill = k; } });

  return {
    gender: state.gender,
    zodiac,
    color,
    colorTally: colorResult.tally,
    colorDesc: ZODIAC_DATA.colorDesc[`${state.gender}_${color}`],
    traits,
    dominantTrait,
    overallWill,
    sens: dominantTrait.pricing.sens,
    prem: dominantTrait.pricing.prem,
    zodiacInfo: ZODIAC_DATA.zodiac[zodiac],
    zodiacSupp: ZODIAC_DATA.zodiacSupp[zodiac],
    createdAt: new Date().toISOString(),
  };
}

/* ---------------- Step 4: Result ---------------- */
function renderResult() {
  const r = state.result;
  document.documentElement.style.setProperty("--accent", COLOR_HEX[r.color]);
  document.documentElement.style.setProperty("--accent-soft", COLOR_HEX[r.color] + "1a");

  const c = document.createElement("div");

  const hero = `
    <div class="result-hero">
      <div class="zodiac-emoji">${ZODIAC_EMOJI[r.zodiac]}</div>
      <h2>${r.zodiac} · 荣格${r.color}型人格</h2>
      <p>${r.colorDesc}</p>
      <span class="badge">主导特质：${TRAIT_NAMES[r.dominantTrait.dimKey]}${r.dominantTrait.level === "H" ? "高分型" : "低分型"}</span>
    </div>
  `;

  const traitsBars = r.traits.map(t => `
    <div class="trait-row">
      <div class="t-name">${TRAIT_NAMES[t.dimKey]}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${t.pct}%"></div></div>
      <div class="t-score">${t.score}/10</div>
    </div>
  `).join("");

  const metrics = `
    <div class="metric-grid">
      <div><span class="m-label">付费意愿</span><span class="m-value">${r.overallWill}</span></div>
      <div><span class="m-label">价格敏感度</span><span class="m-value">${r.sens}</span></div>
      <div><span class="m-label">溢价接受度</span><span class="m-value">${r.prem}</span></div>
    </div>
  `;

  const traitCards = r.traits.map(t => `
    <div class="trait-card">
      <div class="th"><span>${TRAIT_NAMES[t.dimKey]}</span><span class="lvl">${t.level === "H" ? "高分型" : "低分型"} · ${t.score}/10</span></div>
      <p class="text-block">${t.need}</p>
      <p class="text-block"><b>安防建议：</b>${t.corePref}</p>
    </div>
  `).join("");

  const zodiacBlock = `
    <p class="text-block"><b>养老核心需求：</b>${r.zodiacSupp.need}</p>
    <p class="text-block"><b>消费偏好：</b>${r.zodiacSupp.pref}</p>
    <p class="text-block"><b>消费行为特征：</b>${r.zodiacSupp.behavior}</p>
    <p class="text-block"><b>星座消费喜好：</b>${r.zodiacInfo.spend}</p>
    <p class="text-block"><b>星座居家安全需求：</b>${r.zodiacInfo.security}</p>
  `;

  c.innerHTML = `
    ${hero}
    <div class="card">
      <div class="section-title">大五人格五维度</div>
      ${traitsBars}
    </div>
    <div class="card">
      <div class="section-title">居家保全付费画像</div>
      ${metrics}
    </div>
    <div class="card">
      <div class="section-title">各人格维度 × 居家安防建议</div>
      ${traitCards}
    </div>
    <div class="card">
      <div class="section-title">${r.zodiac}星座特征</div>
      ${zodiacBlock}
    </div>
    <div class="nav-row">
      <button class="btn btn-ghost" id="restart-btn">重新测试</button>
      <button class="btn btn-primary" id="history-btn">查看历史记录</button>
    </div>
    <p class="footnote">结果已同步保存至你的 SLCC 帐号</p>
  `;

  c.querySelector("#restart-btn").onclick = () => {
    state.step = 0;
    state.gender = null; state.zodiac = null; state.birthMonth = null; state.birthDay = null;
    state.colorAnswers = Array(COLOR_QUIZ.length).fill(null);
    state.bfiAnswers = Array(BFI10_ITEMS.length).fill(null);
    state.result = null;
    document.documentElement.style.setProperty("--accent", "#b0473f");
    document.documentElement.style.setProperty("--accent-soft", "#f3e6e4");
    render();
  };
  c.querySelector("#history-btn").onclick = () => renderHistory();

  return c;
}

/* ---------------- Supabase persistence ---------------- */
async function saveProfile(result) {
  if (!state.session) return;
  try {
    await supabaseClient.from("slcc_personality_security_profiles").insert({
      user_id: state.session.user.id,
      gender: result.gender,
      zodiac: result.zodiac,
      jung_color: result.color,
      dominant_trait: result.dominantTrait.traitCn,
      dominant_level: result.dominantTrait.level,
      openness_score: result.traits.find(t => t.dimKey === "O").score,
      conscientiousness_score: result.traits.find(t => t.dimKey === "C").score,
      extraversion_score: result.traits.find(t => t.dimKey === "E").score,
      agreeableness_score: result.traits.find(t => t.dimKey === "A").score,
      neuroticism_score: result.traits.find(t => t.dimKey === "N").score,
      payment_willingness: result.overallWill,
      price_sensitivity: result.sens,
      premium_acceptance: result.prem,
    });
  } catch (e) {
    console.error("保存结果失败", e);
  }
}

async function renderHistory() {
  const root = el("app-root");
  root.innerHTML = `<div class="card"><h2 class="step-title">历史记录</h2><div id="history-list">载入中…</div>
    <div class="nav-row"><button class="btn btn-ghost" id="back-to-result">返回</button></div></div>`;
  root.querySelector("#back-to-result").onclick = () => render();

  if (!state.session) return;
  const { data, error } = await supabaseClient
    .from("slcc_personality_security_profiles")
    .select("*")
    .eq("user_id", state.session.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const list = root.querySelector("#history-list");
  if (error) { list.textContent = "载入失败：" + error.message; return; }
  if (!data || data.length === 0) { list.textContent = "尚无历史记录"; return; }

  list.innerHTML = data.map(row => `
    <div class="history-item">
      <span>${ZODIAC_EMOJI[row.zodiac] || ""} ${row.zodiac} · ${row.jung_color} · ${row.dominant_trait}${row.dominant_level === "H" ? "高" : "低"}</span>
      <span class="h-meta">${new Date(row.created_at).toLocaleDateString()}</span>
    </div>
  `).join("");
}

/* ---------------- Boot ---------------- */
function initApp(session) {
  state.session = session;
  render();
}
