# Shoka 技術設計

## 1. 設計方針

- SEOとSSRを必要としないSPAとして構築する
- 静的UIとサーバーAPIの責務を分離する
- APIキーと外部API呼び出しはCloudflare Worker内に閉じる
- 楽天Books API固有の形式をアプリ内部モデルへ正規化する
- サーバーの24時間キャッシュとブラウザの短期キャッシュを分ける
- 無料枠に収まる小さな構成を維持する

## 2. 採用技術

| 領域 | 技術 | 用途 |
| --- | --- | --- |
| 言語 | TypeScript | クライアント、Worker、共有型 |
| ビルド | Vite | SPAとWorkerの開発・ビルド |
| UI | React | 画面実装 |
| ルーティング | TanStack Router | 型安全な画面URLと検索パラメータ |
| データ取得 | TanStack Query | debounce検索、短期キャッシュ、無限スクロール |
| API | Hono | Worker上のAPIルーティングとエラー変換 |
| APIクライアント | Hono RPC | 入出力型の共有 |
| スタイル | Tailwind CSS | レスポンシブUI、配色、余白 |
| UI部品 | shadcn/ui | Dialog、Input、Button、Skeletonなど必要部分のみ |
| 実行環境 | Cloudflare Workers | Hono APIと静的アセット配信 |
| サーバーキャッシュ | Workers KV | 24時間の検索・書誌キャッシュ |
| 外部データ | 楽天Books Book Search API | 紙書籍の検索と書誌・書影取得 |
| パッケージ管理 | pnpm | 依存関係とスクリプト管理 |

Next.jsは採用しない。将来SEOまたはSSRが必須になった場合に、Next.jsまたはTanStack Startを再評価する。

## 3. 全体構成

```text
Browser
  ├─ Vite + React SPA
  │    ├─ TanStack Router
  │    ├─ TanStack Query
  │    └─ Hono RPC client
  │
  └─ /api/*
       ↓
Cloudflare Worker
  ├─ Hono
  ├─ 入力検証・正規化
  ├─ Workers KV（TTL 24時間）
  └─ 楽天Books API adapter
```

静的アセットとWorker APIはCloudflare WorkersのVite連携で一体配備する。`/api/*`だけWorkerを先に実行し、それ以外はSPAの静的アセットまたはSPAフォールバックへ流す。

## 4. 推奨ディレクトリ構成

```text
.
├── src/
│   ├── routes/                 # TanStack Router routes
│   ├── components/
│   │   ├── ui/                 # 選択導入したshadcn/ui
│   │   ├── book-card.tsx
│   │   ├── book-dialog.tsx
│   │   └── masonry-grid.tsx
│   ├── features/
│   │   ├── author-search/
│   │   └── book-gallery/
│   ├── lib/
│   │   ├── api-client.ts       # Hono RPC client
│   │   ├── publication-date.ts
│   │   └── seeded-shuffle.ts
│   └── styles/
├── worker/
│   ├── app.ts                  # Hono appとAppType export
│   ├── routes/
│   ├── services/
│   │   ├── rakuten-books.ts
│   │   └── book-catalog.ts
│   ├── cache/
│   └── schemas/
├── shared/
│   └── book.ts                 # 正規化済みドメイン型
├── tests/
│   ├── fixtures/
│   └── e2e/
├── docs/
├── vite.config.ts
├── wrangler.jsonc
└── package.json
```

実装時にCloudflare公式テンプレートの構成と競合する場合は、責務の分離を保ったままディレクトリ名を調整する。

## 5. 画面ルート

| ルート | 内容 |
| --- | --- |
| `/` | サービス説明、著者検索、著者候補 |
| `/authors/$authorName` | 著者の書籍一覧 |

著者ページはアプリ内遷移と再読み込みに必要な固定URLを持つが、SEO最適化はしない。

表示モードはURL検索パラメータ`view=random|year`で表現する。既定値は`random`とする。ランダム順のseedはクライアントで生成し、追加読み込み中だけ保持する。「もう一度混ぜる」でseedを更新する。

## 6. API設計

Hono RPCで次のエンドポイントを提供する。名称は実装時に型推論しやすい形へ微調整してよい。

### 6.1 著者候補検索

```http
GET /api/authors?q={query}
```

```ts
type AuthorSearchResponse = {
  authors: Array<{ name: string }>
}
```

- 入力をUnicode正規化し、前後空白と連続空白を整える
- 空文字を拒否する
- 最大長を設定する
- 楽天Booksの書籍検索結果から著者候補を抽出・重複排除する
- 完全一致が一件の場合はクライアントが直接著者ページへ遷移する

楽天APIは独立した著者エンティティを返さないため、同姓同名と共著者文字列の分解精度は[未決事項](open-issues.md)のスパイク対象とする。

### 6.2 著者の書籍一覧

```http
GET /api/authors/:authorName/books?view={random|year}&cursor={cursor}&seed={seed}
```

```ts
type BookPageResponse = {
  authorName: string
  total: number
  items: BookEdition[]
  nextCursor: string | null
  source: 'rakuten-books'
}
```

- 一ページ約30件
- キャッシュミス時は楽天APIを必要ページ数だけ取得し、正規化済み全件をKVへ保存する
- `random`ではseed付きの決定的シャッフル後にページ分割する
- `year`では正規化済み刊行日、書名、ISBNの順に安定ソートしてページ分割する
- cursorはクライアントが内容へ依存しない不透明文字列とする
- 同じseedとcursorに対して同じ結果を返し、重複・欠落を防ぐ

## 7. 内部データモデル

```ts
type PublicationPrecision =
  | 'day'
  | 'early-month'
  | 'mid-month'
  | 'late-month'
  | 'month'
  | 'year'
  | 'unknown'

type PublicationDate = {
  raw: string | null
  year: number | null
  month: number | null
  day: number | null
  precision: PublicationPrecision
  sortKey: string
}

type BookEdition = {
  id: string
  title: string
  authors: string[]
  publisher: string | null
  publicationDate: PublicationDate
  format: string | null
  isbn: string | null
  coverUrl: string | null
  description: string | null
}
```

`id`はISBNを優先し、ISBNがない場合はデータ源の安定識別子、最後に正規化項目から生成するハッシュを使う。外部APIのレスポンスをUIから直接参照しない。

## 8. 楽天Books APIアダプター

### 8.1 リクエスト方針

- Books Book Search APIを使用する
- 著者名を検索条件にする
- `hits=30`を使う
- 品切れを含める指定を使う
- 電子書籍APIは呼ばない
- APIキーとアクセスキーはWorker Secretsで管理する
- 外部APIのレスポンスをそのままクライアントへ返さない

### 8.2 正規化とフィルター

- 紙書籍として扱える商品だけを残す
- 全集セット、雑誌、ムック、音声商品を除外する
- 検索対象者が単著または共著として含まれる項目を残す
- 原作、監修、編集、翻訳、解説だけの関与を可能な範囲で除外する
- ISBNを正規化する
- 発売日を精度付き`PublicationDate`へ変換する
- 欠損値は`null`とし、架空値で補わない

楽天APIの著者フィールドだけで役割を厳密に分類できない可能性がある。ヒューリスティックは実データスパイク後に確定する。

## 9. キャッシュ設計

### 9.1 Workers KV

- TTLは24時間
- 正規化済み著者候補と著者別全書籍を保存する
- キーにはスキーマバージョンと正規化済み検索値のハッシュを含める
- 例：`authors:v1:{queryHash}`、`books:v1:{authorHash}`
- APIキーやユーザー入力の生ログを保存しない
- ユーザー向け強制更新機能は設けない

### 9.2 TanStack Query

- debounce検索の競合キャンセルを管理する
- `useInfiniteQuery`でcursorと追加読み込みを管理する
- 同じ検索語と著者ページの短期キャッシュを持つ
- サーバーの24時間TTLより短い`staleTime`を設定する
- スクロール末尾の監視では、次ページがあり取得中でない場合だけ`fetchNextPage`する

## 10. ランダム順

- Fisher–Yates相当のseed付き決定的シャッフルを使う
- `Math.random()`へ直接依存しない
- seedと正規化済み書籍一覧が同じなら順序も同じにする
- モードへ入る際にseedを生成する
- 「もう一度混ぜる」でseedを再生成する
- 画面幅変更と追加読み込みではseedを変えない

## 11. masonry実装

- 外部masonryライブラリを使わない
- CSS GridとResizeObserverでカード高に応じた配置を計算する
- 列幅はブレークポイントごとに等幅とする
- DOM順はランダム順または出版年順の論理順序を維持する
- 画像の縦横比を可能な限り先に確保し、読み込み後のレイアウト移動を抑える
- `prefers-reduced-motion`では配置変更のアニメーションを無効化する
- ResizeObserver未対応や計算失敗時は通常のレスポンシブグリッドへフォールバックする

ネイティブCSS masonryが全対象ブラウザで安定した場合に置換できるよう、`MasonryGrid`内へ実装を閉じ込める。

## 12. エラー設計

Workerは外部APIエラーをアプリ固有のエラーへ変換する。

| 状況 | HTTP | クライアント表示 |
| --- | --- | --- |
| 不正入力 | 400 | 入力を確認する案内 |
| 該当なし | 200 | 候補または本が見つからない空状態 |
| 外部API制限・障害 | 502または503 | 取得失敗と再試行ボタン |
| KV障害 | 可能なら外部APIへフォールバック | 失敗時のみ再試行案内 |
| 想定外 | 500 | 一般的な失敗案内 |

技術詳細、秘密情報、外部APIレスポンス本文をクライアントへ露出しない。

## 13. セキュリティとプライバシー

- 楽天APIキー、アクセスキー、Cloudflare資格情報をコミットしない
- Worker SecretsまたはローカルのWrangler認証を使う
- Honoの全検索入力をランタイム検証する
- 入力長とページパラメータを制限する
- 外部URLは許可した書影ホストだけを使用する
- HTMLとして内容紹介を挿入せず、テキストとして描画する
- Cookie、ユーザーID、利用分析イベントを使わない
- 独自のアクセスログ・計測基盤を作らない

## 14. アクセシビリティ実装

- 書籍カードは`button`相当の操作要素とし、書名をアクセシブル名にする
- 書影の代替テキストは重複読み上げを避けて設計する
- shadcn/ui Dialogのタイトルと説明を適切に関連付ける
- ダイアログを閉じたら起点カードへフォーカスを戻す
- 無限読み込みの状態を視覚表示し、必要な範囲でaria-live通知する
- 表示モード切替を現在状態が分かるコントロールにする
- フォーカスリングを消さない

## 15. テスト設計

### 15.1 単体テスト

- 発売日パーサーと全精度
- 出版年ソートと同順位の安定化
- seed付きシャッフルの再現性
- 対象商品フィルター
- ISBNと検索語の正規化

### 15.2 APIテスト

- 楽天API fixtureから内部モデルへの変換
- Honoの成功、該当なし、不正入力、外部障害レスポンス
- KV hit、miss、期限切れ相当
- cursorによる重複・欠落の防止

実APIを通常テストから呼ばない。手動の疎通コマンドだけを別途用意する。

### 15.3 UIテスト

- debounce、IME、Enter即時検索、古いリクエストのキャンセル
- 著者候補選択と完全一致時の遷移
- ランダム／出版年切替
- 無限スクロール
- 書影欠損プレースホルダー
- 詳細ダイアログの表示・省略項目・フォーカス

### 15.4 E2E

- PC幅とモバイル幅で検索から詳細表示まで
- 追加読み込みと再シャッフル
- 出版年セクション
- エラーと再試行
- キーボードだけの主要導線
- 自動アクセシビリティ検査

## 16. 性能設計

- SPAの初期JavaScriptを必要最小限にする
- 詳細ダイアログなどを必要に応じて遅延読み込みする
- 書影に`loading="lazy"`と適切な寸法を設定する
- 最初の約30冊だけ描画・取得する
- APIレスポンスを必要項目だけへ正規化する
- KVへ外部APIの巨大な生レスポンスを保存しない
- 代表著者でキャッシュ済み2秒、初回5秒の目標を検証する

## 17. CIとデプロイ

`main`へのpushではGitHub Actionsで次を実行する。

1. lint
2. 型チェック
3. 単体・API・コンポーネントテスト
4. 主要E2E
5. プロダクションビルド

自動デプロイはしない。

```text
pnpm check
  └─ lint + typecheck + tests + e2e + build

pnpm deploy
  └─ pnpm check → wrangler deploy
```

`pnpm deploy`はチェック成功時だけ公開する。Cloudflare認証情報をリポジトリへ保存しない。

## 18. 無料枠

想定するCloudflare無料枠は次のとおり。実装時に最新値を再確認する。

- 静的アセット：無料配信
- Worker：1日10万リクエスト
- Worker CPU：1リクエスト10ms
- KV：1日10万読み取り、1,000書き込み、1GB

上限超過時の処理失敗を許容する。大量書誌の取得・正規化がCPU 10msへ収まるかは実装前スパイクで計測する。

## 19. データ源表記

画面内の「情報について」に、楽天Books APIを利用していること、情報の完全性を保証しないこと、訂正窓口を設けていないことを記載する。表示文言と書影利用方法は、実装時点の楽天Web Service利用規約を再確認して確定する。

