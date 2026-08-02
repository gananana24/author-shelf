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

### 作業

- `pnpm init`でpackageを作る
- Vite、React、TypeScriptを導入する
- Cloudflare Vite pluginとWranglerを導入する
- `worker/index.ts`へHonoを配置する
- Wranglerの静的アセット設定をSPAフォールバックにする
- `/api/health`を追加する
- `.wrangler`、`.dev.vars*`、生成型、ビルド成果物をGit対象外にする

この段階ではTanStack Router、TanStack Query、Tailwind CSS、shadcn/uiをまだ使わなくてもよい。Cloudflare WorkerとReact SPAが同じ開発サーバーで動くことを先に確認する。

### 完了条件

- `pnpm dev`でトップ画面が開く
- ブラウザから`GET /api/health`を呼べる
- `pnpm build`が成功する
- React側へWorker専用コードが混入していない

## 3. Step 2: 型とモックAPIを作る

### 作業

- `shared/book.ts`へ`BookEdition`と`PublicationDate`を定義する
- Hono RPCで次のAPI契約を作る

```http
GET /api/authors?q={query}
GET /api/authors/:authorName/books?view={random|year}&cursor={cursor}&seed={seed}
```

- `worker/services/book-catalog.ts`をデータ取得のインターフェースにする
- `worker/services/mock-book-catalog.ts`へモック実装を置く
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
