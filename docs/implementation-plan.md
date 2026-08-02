# Shoka 実装手順

## 1. 現在の進め方

楽天APIの許可サイトへローカル環境を登録できないため、次の順番で進める。

1. ローカルで動くアプリ基盤を作る
2. HonoのモックAPIで主要導線を完成させる
3. Cloudflareへ仮デプロイして`workers.dev`のURLを取得する
4. そのURLで楽天Web Serviceのアプリを登録する
5. モック実装の背後を楽天APIアダプターへ差し替える

画面からモックデータを直接importしない。フロントエンドは最初から`/api/*`だけを呼び、Hono側のデータ提供実装を交換可能にする。

## 2. Step 1: 最小構成を起動する

既存のVite、React、TanStack Router、Tailwind CSSはそのまま使い、同じVite開発サーバーへCloudflare Worker上のHono APIを追加する。HonoでHTMLを生成するSSR構成には変更しない。

この段階ではCloudflareへのログインやデプロイを行わない。Cloudflare Vite Pluginは、本番に近いWorkers環境をローカルで動かすために使用する。

### 2.1 依存関係を追加する

```sh
pnpm add hono
pnpm add -D @cloudflare/vite-plugin wrangler @cloudflare/workers-types
```

すでに追加済みのパッケージは再インストールしなくてよい。`hono`はアプリの実行に必要なので`dependencies`、それ以外は開発・ビルド用なので`devDependencies`へ置く。

`pnpm create hono`は実行しない。既存のReact SPAをHonoのSSRテンプレートで置き換えないためである。

### 2.2 `src`内で画面とAPIを分離する

アプリのコードは`src/`へまとめ、その中でReact SPA、Hono API、共有コードの責務を分ける。

```text
src/
├── app/                 # React SPA
│   ├── main.tsx
│   ├── index.css
│   ├── routeTree.gen.ts
│   └── routes/
├── api/
│   └── index.ts         # Hono API
└── shared/              # 画面とAPIで共有するドメイン型
```

`api`はコードの責務を表す名前とし、Cloudflare固有の`worker`という名前はディレクトリに使わない。実行環境を変更してもAPIコードの置き場所を維持できる。TypeScript設定の`include`を分け、React用設定がAPIコードまで対象にしないようにする。

### 2.3 Worker用のTypeScript設定を作る

ルートへ`tsconfig.worker.json`を作る。

```jsonc
{
  "extends": "./tsconfig.node.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.worker.tsbuildinfo",
    "types": ["@cloudflare/workers-types", "vite/client"],
    "strict": true,
  },
  "include": ["src/api", "src/shared"],
}
```

`tsconfig.app.json`の`include`は`["src/app", "src/shared"]`とする。

続いて`tsconfig.json`の参照へWorkerを追加する。

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.worker.json" }
  ]
}
```

### 2.4 Wranglerをローカル用に設定する

ルートへ`wrangler.jsonc`を作る。

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "shoka",
  "compatibility_date": "2026-08-01",
  "main": "./src/api/index.ts",
  "assets": {
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"],
  },
}
```

- `/api/*`は静的アセットより先にWorkerで処理する
- それ以外の未知のパスは`index.html`へフォールバックし、TanStack Routerへ渡す
- Vite Plugin使用時は`assets.directory`を手動指定しない

### 2.5 Honoのヘルスチェックを作る

`src/api/index.ts`を次の内容にする。

```ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/api/health', (c) => {
  return c.json({ status: 'ok' })
})

export default app
```

フロントエンドとAPIは同一オリジンで動くため、ここではCORSを追加しない。

### 2.6 Cloudflare Vite Pluginを追加する

`vite.config.ts`を次の構成にする。TanStack Router PluginはReact Pluginより前、Cloudflare PluginはReact Pluginより後ろへ置く。

```ts
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/app/routes',
      generatedRouteTree: './src/app/routeTree.gen.ts',
    }),
    tailwindcss(),
    react(),
    cloudflare(),
  ],
})
```

### 2.7 ローカル生成物をGit対象外にする

`.gitignore`へ次を追加する。

```gitignore
.wrangler
.dev.vars*
```

`.dev.vars`には将来ローカル用の秘密情報を置く。値やファイル本体はコミットしない。

### 2.8 ローカルで確認する

開発サーバーを起動する。

```sh
pnpm dev
```

別のターミナルからAPIを確認する。

```sh
curl -i http://localhost:5173/api/health
```

本文が次なら接続成功である。

```json
{ "status": "ok" }
```

ブラウザでは次も確認する。

- `/`がReactで表示される
- `/about`を直接開いてもReactで表示される
- `/api/health`はHTMLではなくJSONを返す

最後に本番用ビルドまで確認する。

```sh
pnpm build
```

この時点では`wrangler login`、`wrangler deploy`、KV、楽天APIの環境変数を設定しない。

### 完了条件

- `pnpm dev`でトップ画面が開く
- `GET /api/health`が`200`と`{"status":"ok"}`を返す
- `/about`の直接表示がSPAフォールバックで成功する
- `pnpm build`が成功する
- React側へWorker専用コードが混入していない

## 3. Step 2: 型とモックAPIを作る

### 作業

- `src/shared/book.ts`へ`BookEdition`と`PublicationDate`を定義する
- Hono RPCで次のAPI契約を作る

```http
GET /api/authors?q={query}
GET /api/authors/:authorName/books?view={random|year}&cursor={cursor}&seed={seed}
```

- `src/api/services/book-catalog.ts`をデータ取得のインターフェースにする
- `src/api/services/mock-book-catalog.ts`へモック実装を置く
- Honoのルートからはインターフェースだけを参照する
- 空文字、過長入力、不正な`view`と`cursor`を400にする

### モックデータに必要なケース

- 著者候補が複数になる検索語
- 完全一致が一件になる著者名
- 60冊以上を持ち、3ページ以上に分かれる著者
- 共著者がいる本
- 書影なし、紹介文なし、ISBNなしの本
- 年月日、上旬・中旬・下旬、年月のみ、年のみ、刊行年不明
- 同じseedなら同じ順序、異なるseedなら異なる順序

書影は外部サイトへ依存せず、ローカルのSVGかモック画像を使う。実在書籍と誤解されないタイトルにし、画面には「モックデータ」と表示する。

### 完了条件

- APIを直接呼んで候補検索と30件単位のページングを確認できる
- 同じseedとcursorで結果が再現する
- モックデータを楽天APIレスポンス形式へ寄せていない
- APIテストが成功する

## 4. Step 3: ルーティングとデータ取得を接続する

### 作業

- TanStack Routerのファイルベースルーティングを導入する
- `/`と`/authors/$authorName`を作る
- `view=random|year`をURL検索パラメータとして検証する
- TanStack QueryとHono RPCクライアントを導入する
- 取得失敗を画面用エラーへ変換する

### 完了条件

- URLを直接開いて各画面を再表示できる
- 不正な`view`は`random`へ正規化される
- Reactコンポーネントがモックデータを直接importしていない

## 5. Step 4: 検索導線を完成させる

### 作業

- トップ画面へサービス説明と検索欄を置く
- 500ms debounceを実装する
- IME変換中は検索しない
- Enterと検索ボタンでは即時検索する
- 新しい検索時に古いリクエストをキャンセルする
- 著者候補を名前だけで表示する
- 完全一致一件なら著者ページへ直接遷移する

### 完了条件

- 日本語IME入力で変換途中のリクエストが発生しない
- 連続入力しても古い結果が新しい結果を上書きしない
- マウス、タッチ、キーボードで候補を選べる

## 6. Step 5: 著者ページを通常グリッドで完成させる

### 作業

- 著者名、総件数、ランダム／出版年切替を表示する
- 最初の約30冊と無限スクロールを実装する
- 「もう一度混ぜる」でseedを更新する
- 出版年ごとの見出しと日付順を実装する
- 書影カード、書影なしプレースホルダー、詳細ダイアログを作る
- スケルトン、空状態、失敗表示、再試行を作る

この段階ではmasonryにせず、等幅の通常CSS Gridでよい。検索から詳細表示までの状態遷移を先に安定させる。

### 完了条件

- 追加読み込みで重複や順序変更が起きない
- 画面幅変更でランダム順が変わらない
- 年表示が定義済みの日付規則に従う
- ダイアログをEscapeで閉じ、起点カードへフォーカスが戻る

## 7. Step 6: 見た目とmasonryを追加する

### 作業

- Tailwind CSSを導入する
- shadcn/uiからDialog、Input、Button、Skeletonだけを取り込む
- CSS GridとResizeObserverで等幅masonryを実装する
- 画像の縦横比を事前確保する
- `prefers-reduced-motion`へ対応する
- 計算できない場合は通常グリッドへフォールバックする

### 完了条件

- モバイルとPCで列幅が揃う
- 画像読込後と追加読込時の大きなレイアウト移動がない
- DOM順とキーボード操作順が論理順序を維持する

## 8. Step 7: 仮公開して楽天API検証へ進む

### 作業

- ここまでのlint、型チェック、テスト、buildを成功させる
- Wranglerへログインする
- Cloudflareへ手動で仮デプロイする
- 発行された`workers.dev`ホスト名を楽天の許可サイトへ登録する
- Application IDとAccess KeyをWorker Secretsで管理する
- 楽天利用条件に従い、クレジットと商品ページリンクを表示する

### 完了条件

- 公開URLからモック版を操作できる
- 楽天Web Serviceのアプリ登録が完了する
- 秘密情報がGit履歴とブラウザバンドルへ含まれない

## 9. 推奨コミット単位

`main`へ直接pushする場合も、次の単位で戻せるようにする。

1. `chore: initialize vite and hono foundation`
2. `feat: add typed mock catalog api`
3. `feat: add author search flow`
4. `feat: add author book gallery`
5. `feat: add book detail dialog`
6. `feat: add responsive masonry layout`
7. `chore: prepare cloudflare preview deployment`

各コミット前に、その変更へ関係するテストと型チェックを実行する。最終的には`pnpm check`へ全チェックをまとめる。
