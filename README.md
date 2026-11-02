# 戴文軒 TAI MAN HIN — 攝影作品集

復古電影感 × 科技 HUD 風格的單頁攝影作品集。純 HTML / CSS / JavaScript，沒有框架、沒有建置步驟，可直接放在 GitHub Pages。

## 網站特色

- 全螢幕煙花主視覺，搭配電影顆粒、掃描線與琥珀金點綴
- 16 件作品，4 × 4 作品格；「全部 / 精選 / 風景」即時篩選
- 點圖開啟 Lightbox：先顯示 1800px 預覽，背景載入 **原始 6048 × 4032 JPG**，完成後顯示 `FULL RES`
- Lightbox 內建「下載原圖」、左右鍵切換、手機滑動切換
- 繁體中文 ⇄ English 切換，選擇會存在瀏覽器
- 關於我、Email、Instagram、複製 Email
- 響應式版面、`prefers-reduced-motion` 支援、鍵盤操作與 ARIA 標籤

## 本機預覽

最快的方式是直接用瀏覽器打開 `index.html`。

如果想測試完整行為（複製 Email、字型與相對路徑），建議開一個本機伺服器：

```powershell
cd C:\Users\tai\Desktop\photo-portfolio
python -m http.server 8000
```

然後開啟 <http://localhost:8000>。

## 檔案結構

```text
photo-portfolio/
├─ index.html                  # 所有文案與作品資料
├─ css/style.css               # 設計系統與版面
├─ js/main.js                  # 語言、篩選、Lightbox、選單、複製 Email
├─ assets/
│  ├─ favicon.svg
│  └─ images/
│     ├─ hero/
│     │  ├─ hero-desktop.webp  # 3200 × 2133（電腦）
│     │  └─ hero-mobile.webp   # 1400 × 1867（手機）
│     ├─ works/                # 900 / 1800px 高品質顯示縮圖
│     ├─ originals/            # 16 張原始 JPG（不重新壓縮）
│     └─ og-cover.jpg          # 社群分享預覽圖 1200 × 630
├─ tools/optimize_images.py   # 之後新增照片時可用的縮圖工具
└─ README.md
```

## 畫質說明

- `assets/images/originals/` 是從桌面 `煙花` 資料夾複製過來的原始檔案，**位元組完全沒有改動、沒有重新壓縮**。
- 作品格與首頁使用 900 / 1800px 的 WebP 縮圖，原因是 16 張原圖加起來約 170MB；若全部一次載入，手機幾乎打不開。
- 點開作品時，會先顯示 1800px 預覽，再於背景載入原始 JPG。載入完成後，Lightbox 右上角會由 `FULL RES…` 變成 `FULL RES`，並可下載原圖。
- 如果你真的想連作品格都直接載入原圖，把 `index.html` 裡每張 `<img>` 的 `src` / `srcset` 換成 `assets/images/originals/work-XX.jpg` 即可；但不建議，載入會非常慢。

## 修改內容

### 文案與語言

所有可切換文字都使用 `data-zh` / `data-en`：

```html
<span data-zh="作品" data-en="Works">作品</span>
```

修改時**同時改 `data-zh`、`data-en` 和標籤內目前顯示的中文**即可。

「關於我」目前是示範文案，建議換成你的真實簡介、展覽經歷與創作理念。

### 作品資料

每件作品是 `index.html` 裡的一個 `<article class="work-card">`。重要屬性：

| 屬性 | 用途 |
| --- | --- |
| `data-title-zh` / `data-title-en` | Lightbox 標題 |
| `data-location-zh` / `data-location-en` | 拍攝地點 |
| `data-note-zh` / `data-note-en` | Lightbox 作品說明 |
| `data-category` | 篩選分類，目前是 `landscape` |
| `data-featured` | 是否出現在「精選」 |
| `data-preview` | 1800px 預覽圖 |
| `data-original` | 原始 JPG（Lightbox 全畫質與下載） |

卡片上的 `<img src="...900.webp">`、`srcset`、`alt` 也要一起更新。

### 新增照片

1. 把原始 JPG 放進 `assets/images/originals/`。
2. 執行縮圖工具（需要 Python 與 Pillow）：

```powershell
python -m pip install pillow
python tools/optimize_images.py "C:\path\to\your\photo.jpg"
```

工具會產生 `work-XX-900.webp` 與 `work-XX-1800.webp` 到 `assets/images/works/`，並把原圖複製到 `assets/images/originals/`。你也可以直接用 Photoshop / Lightroom 輸出 900px 與 1800px 的 WebP。

3. 在 `index.html` 複製一張 `<article>`，更新編號、資料屬性與圖片檔名。

### 社群與 Email

搜尋以下字串替換：

- `tai.man.hin.110508@gmail.com`
- `https://www.instagram.com/wenxuan0508/`
- `@wenxuan0508`

### 首頁主視覺

替換 `assets/images/hero/hero-desktop.webp` 與 `hero-mobile.webp` 即可。手機版建議使用 3:4 直式構圖；電腦版使用 3:2 橫式。若檔名不同，記得同步修改 `index.html` 的 `<picture>` 與 `<link rel="preload">`。

## 部署到 GitHub Pages

目前專案已在資料夾內初始化為本機 Git repository，但還沒有推送到 GitHub。確認預覽沒問題後：

1. 在 GitHub 建立一個新的 repository，例如 `photo-portfolio`（不要勾選 Add a README）。
2. 在 PowerShell 執行（把 `<你的帳號>` 換成你的 GitHub 使用者名稱）：

```powershell
cd C:\Users\tai\Desktop\photo-portfolio
git remote add origin https://github.com/<你的帳號>/photo-portfolio.git
git branch -M main
git push -u origin main
```

3. 到 repository 的 **Settings → Pages**。
4. **Build and deployment → Source** 選 `Deploy from a branch`。
5. Branch 選 `main`，資料夾選 `/ (root)`，按 **Save**。
6. 等 1～3 分鐘，網站會在：

```text
https://<你的帳號>.github.io/photo-portfolio/
```

### 部署後建議修改

把 `index.html` 裡的社群預覽圖改成完整網址，否則 Facebook / LINE 等平台可能抓不到：

```html
<meta property="og:image" content="https://<你的帳號>.github.io/photo-portfolio/assets/images/og-cover.jpg">
<meta name="twitter:image" content="https://<你的帳號>.github.io/photo-portfolio/assets/images/og-cover.jpg">
```

### 使用 GitHub CLI

如果你已安裝 GitHub CLI，也可以：

```powershell
gh auth login
gh repo create photo-portfolio --public --source=. --remote=origin --push
```

再到 Settings → Pages 開啟即可。

## 注意事項

- 專案包含約 170MB 原始照片，第一次 push 可能需要一些時間。GitHub 單一檔案上限 100MB，本站最大檔案約 12MB，沒有問題；GitHub Pages 網站上限為 1GB。
- 所有照片版權屬於戴文軒，請勿在未經同意的情況下轉載或商業使用。
- 字型使用 Google Fonts：Cormorant Garamond、IBM Plex Mono、Noto Sans TC、Noto Serif TC。若在沒有網路的環境預覽，會退回系統字型。
- 目前 `gh` 尚未登入；如果要用 CLI 建立 repo，先執行 `gh auth login`。
