# 星座人格安防画像 (Astro-Persona Security Profile)

12星座 × 大五人格（BFI-10）× 荣格性格色彩 —— 居家保全付费特征测试 PWA。

与你现有的 SLCC 生态系统共用同一个 Supabase 专案与登入帐号：

| 项目 | 内容 |
|---|---|
| Supabase Project | `txvyplfaaisrzbwpoqcd` |
| 共用登入 | 与 `slcc` 儀表板 / `pwa` 管理端 / `match` / `like` 同一组帐号密码 |
| 新增資料表 | `slcc_personality_security_profiles` |

## 這個 App 做了什麼

1. **荣格色彩测验**（8 题强制选择）→ 判断使用者主色：红 / 蓝 / 黄 / 绿
2. **BFI-10 大五人格量表**（10 题）→ 算出开放性 / 尽责性 / 外倾性 / 宜人性 / 神经质 五个维度的高分型／低分型
3. **星座**（生日自动判断，或手动选择）
4. 三者组合查表，产出：
   - 每个人格维度对应的**居家养老需求**
   - **付费意愿 / 价格敏感度 / 溢价接受度**
   - 组合出的**核心付费偏好**建议句（荣格色彩基础语句 + 人格特质语句 + 星座特征片段）
   - 星座本身的消费喜好与居家安全需求

所有查表逻辑与原始 Excel（`12星座大五人格荣格色彩居家保全付费特征表.xlsx` 共 960 列）**数学等价**：
经过验证，「核心付费偏好」= 荣格色彩基础语句 + 人格特质语句(仅取决于维度+高低分) + 星座片段，
三者可自由组合，所以前端只需内嵌约 8KB 的正规化查表资料（`data.js`），
不需要把 960 列全部塞进前端。

## 檔案結構

```
index.html          主頁面（含登入闸门 + App 容器）
style.css           樣式
app.js              測試流程、計分邏輯、結果渲染、Supabase 存取
data.js             正規化查表資料 + BFI-10 題目 + 荣格色彩題目
auth-guard.js       共用 Supabase Auth 登入闸门（與 match/like repo 同一套 pattern）
manifest.json       PWA manifest
sw-v1.js            Service Worker（見下方「更新注意事項」）
supabase/
  migration.sql     建表 + GRANT + RLS
icon-192.png / icon-512.png   PWA 圖示（請自行放入）
```

## 部署到 GitHub Pages（`jp169zx-GH/db` repo）

1. 建立 / clone `https://github.com/jp169zx-GH/db`
2. 把本資料夾所有檔案（除了 `supabase/`）放到 repo 根目錄
3. GitHub repo → Settings → Pages → Source 選擇 `main` 分支 `/ (root)`
4. 部署後網址會是 `https://jp169zx-gh.github.io/db/`
5. **請用 GitHub 網頁版 pencil 圖示逐檔上傳／編輯**（沿用你一貫的作法），
   **不要用拖拉上傳整個資料夾**，否則資料夾結構會被打散（`supabase/migration.sql` 會跑到根目錄）。

## 設定 Supabase 資料表

1. 打開 Supabase Dashboard → 你的專案 (`txvyplfaaisrzbwpoqcd`) → SQL Editor
2. 貼上並執行 `supabase/migration.sql` 全文
3. 確認：
   - Table Editor 出現 `slcc_personality_security_profiles`
   - Authentication → Policies 底下該表有 4 條 RLS policy（select/insert/update/delete own）
   - **別漏掉 GRANT 那兩行** —— 這是你在 slcc 專案上踩過的坑：Postgres 會先檢查
     table-level GRANT，RLS policy 寫得再對，沒有 GRANT 一樣會出現權限錯誤。

## 登入共用說明

`auth-guard.js` 使用與 `slcc` / `pwa` 相同的 Supabase URL 與 anon key，
所以使用者在 `slcc` 儀表板註冊過的帳號，可以直接在這個 App 登入，無需重新註冊。
如果之後 anon key 更換，只要同步更新這個檔案裡的 `SUPABASE_ANON_KEY` 即可。

## Service Worker 更新注意事項（重要）

GitHub Pages 的 Fastly CDN 曾經卡住 `pwa` repo 的 service worker 邊緣快取，
單純修改同一個檔名內的 `CACHE_NAME` 沒有用。因此這裡採用「**改檔名**」的更新策略：

- 目前版本：`sw-v1.js`
- 下次要更新快取邏輯時：新增 `sw-v2.js`，並把 `index.html` 裡
  `navigator.serviceWorker.register("./sw-v1.js")` 改成 `sw-v2.js`
- 不要直接編輯 `sw-v1.js` 內容後期待使用者馬上拿到新版本

## 之後可以擴充的方向

- 目前結果只存最新一次的統計欄位（分數、色彩、星座、主導特質），
  如果想要完整保留每次填答的原始答案，可以在 `slcc_personality_security_profiles`
  多加一個 `jsonb` 欄位存 `colorAnswers` / `bfiAnswers` 原始陣列。
- 目前「整體付費意愿」用 5 個人格維度的多數決＋主導特質作為 fallback，
  之後如果要更精細，可以改成用每個特質的「extremity（離中位數 6 分的距離）」加權平均。
- PWA icon 目前只是 manifest 佔位，需要自行放入 `icon-192.png` / `icon-512.png`。
