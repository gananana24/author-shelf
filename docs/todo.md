# Shoka TODO

## Phase 0: ローカルモック基盤

- [ ] [実装手順](implementation-plan.md)のStep 1に従い、Vite・React・Honoを起動する
- [ ] `/api/health`でSPAとWorkerの接続を確認する
- [ ] 共有ドメイン型とHono RPCのAPI契約を定義する
- [ ] 楽天API形式へ依存しない`BookCatalog`境界を定義する
- [ ] 3ページ以上、欠損項目、不完全な刊行日を含むモックデータを作る
- [ ] 著者候補検索と著者別書籍一覧をモックAPIで返す
- [ ] TanStack RouterとTanStack Queryを接続する
- [ ] 検索から詳細ダイアログまでを通常グリッドで完成させる
- [ ] Tailwind CSS、必要なshadcn/ui、masonryを段階的に追加する
- [ ] モック利用中であることを画面上に明示する
- [ ] ローカルのlint、型チェック、テスト、buildを成功させる

## Phase 1: 仮公開と楽天APIスパイク

- [ ] Cloudflareへモック版を仮デプロイし、`workers.dev`のURLを取得する
- [ ] 楽天Web ServiceのアプリIDとアクセスキーを取得する
- [ ] `workers.dev`のホスト名を楽天の許可サイトへ登録する
- [ ] 楽天Books APIの利用規約、書影利用条件、表記要件を確認する
- [ ] 東野圭吾を含む代表著者3〜5名で実データを保存せずに調査する
- [ ] 件数、書影取得率、日付精度、判型、内容紹介の欠損率を集計する
- [ ] 著者候補の抽出方法を検証する
- [ ] 単著・共著と、それ以外の役割を分けるヒューリスティックを検証する
- [ ] Cloudflare Worker上で全件正規化・ソート・シャッフルのCPU時間を計測する
- [ ] Workers KVの24時間キャッシュ方式を検証する
- [ ] CSS Grid＋ResizeObserverのmasonryをPC・モバイルで試作する
- [ ] スパイク結果を[未決事項](open-issues.md)へ反映し、実装可否を判断する

## Phase 2: 本番向けプロジェクト基盤

- [ ] pnpm、TypeScript、Vite、Reactのプロジェクトを作成する
- [ ] TanStack Routerを導入し、`/`と`/authors/$authorName`を定義する
- [ ] Cloudflare Vite pluginとWorkers設定を追加する
- [ ] Honoを導入し、`/api/*`をWorkerへルーティングする
- [ ] Hono RPCの共有型とクライアントを設定する
- [ ] TanStack Queryを導入する
- [ ] Tailwind CSSを導入する
- [ ] shadcn/uiからDialog、Input、Button、Skeletonを追加する
- [ ] Worker Bindingsの型生成を設定する
- [ ] `.dev.vars*`、Wrangler生成物、秘密情報を`.gitignore`へ追加する

## Phase 3: ドメインと外部API

- [ ] `BookEdition`と`PublicationDate`を定義する
- [ ] 検索語とISBNの正規化を実装する
- [ ] 発売日パーサーと安定ソートを実装する
- [ ] seed付き決定的シャッフルを実装する
- [ ] 楽天Books APIアダプターを実装する
- [ ] 対象・対象外商品のフィルターを実装する
- [ ] 欠損項目を`null`へ正規化する
- [ ] Workers KVのキー、スキーマバージョン、TTLを実装する
- [ ] cursorベースの約30件ページングを実装する

## Phase 4: Hono API

- [ ] 著者候補検索APIを実装する
- [ ] 著者別書籍一覧APIを実装する
- [ ] 入力長、空文字、view、cursor、seedを検証する
- [ ] 外部API、KV、想定外エラーをアプリ固有レスポンスへ変換する
- [ ] APIキーとアクセスキーをWorker Secretsへ登録する
- [ ] 外部レスポンス本文と秘密情報がエラーへ漏れないことを確認する

## Phase 5: UI

- [ ] Shokaのライトテーマと基本レイアウトを作る
- [ ] トップ画面の説明文と著者検索を作る
- [ ] 500ms debounce、IME抑止、Enter即時検索、キャンセルを実装する
- [ ] 著者候補一覧と完全一致一件時の遷移を実装する
- [ ] 著者ページの著者名、総件数、表示切替を実装する
- [ ] 書影カードと書名付きプレースホルダーを実装する
- [ ] CSS Grid＋ResizeObserverの等幅masonryを実装する
- [ ] ランダム表示と「もう一度混ぜる」を実装する
- [ ] 出版年見出しと年別masonryを実装する
- [ ] `useInfiniteQuery`とスクロール末尾監視を実装する
- [ ] 詳細ダイアログと欠損項目省略を実装する
- [ ] スケルトン、空状態、失敗表示、再試行を実装する
- [ ] 「情報について」にデータ源と完全性の説明を追加する

## Phase 6: アクセシビリティと性能

- [ ] カードへ書名のアクセシブル名を付ける
- [ ] 全操作のキーボード導線を確認する
- [ ] ダイアログのフォーカス移動と復帰を確認する
- [ ] 読み込み状態の通知を調整する
- [ ] フォーカスリングとコントラストを確認する
- [ ] `prefers-reduced-motion`へ対応する
- [ ] 書影を遅延読み込みする
- [ ] 初期JavaScriptと遅延読み込み境界を確認する
- [ ] 代表著者でキャッシュ済み2秒、初回5秒の目標を測る
- [ ] Chrome、Safari、Firefox、Edge、iOS Safari、Android Chromeで確認する

## Phase 7: テスト

- [ ] 日付、ソート、シャッフル、フィルター、正規化の単体テストを書く
- [ ] 楽天API fixtureを作成する
- [ ] Hono APIとKV hit/missのテストを書く
- [ ] 検索、表示切替、無限スクロール、ダイアログのUIテストを書く
- [ ] PC・モバイルの主要E2Eを書く
- [ ] キーボード操作と自動アクセシビリティ検査を追加する
- [ ] 実楽天APIを呼ぶ手動疎通コマンドを用意する

## Phase 8: CIと公開

- [ ] `pnpm check`へlint、型チェック、全テスト、E2E、buildをまとめる
- [ ] `pnpm deploy`を`pnpm check`成功後の`wrangler deploy`として定義する
- [ ] `main` pushで`pnpm check`を実行するGitHub Actionsを作る
- [ ] GitHub Actionsから本番を自動デプロイしないことを確認する
- [ ] Cloudflare無料枠とCPU使用量を確認する
- [ ] `workers.dev`へ手動デプロイする
- [ ] 公開後に主要導線を手動確認する

## Definition of Done

- [ ] [MVP仕様書](mvp-spec.md)の受け入れ条件をすべて満たす
- [ ] [未決事項](open-issues.md)の実装前必須項目が解決または明示的に許容されている
- [ ] `pnpm check`が成功する
- [ ] 秘密情報がGit履歴とクライアントバンドルに含まれない
- [ ] 無料枠だけで本番環境が動作する
- [ ] データ源と完全性に関する説明が画面にある
