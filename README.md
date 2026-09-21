# Shoka

著者名から楽天Booksの紙書籍を取得し、刊行順のタイムラインで表示するNext.jsアプリです。

## Getting Started

楽天ウェブサービスでアプリを登録し、`.env.example`を参考に`.env.local`を作成します。

```bash
cp .env.example .env.local
```

次の2項目を設定してください。

```dotenv
RAKUTEN_APPLICATION_ID=your_application_id
RAKUTEN_ACCESS_KEY=your_access_key
RAKUTEN_APP_URL=https://your-registered-site.example
```

`RAKUTEN_APP_URL`には、楽天ウェブサービスの「許可Webサイト」に登録したHTTPSのURLを設定します。楽天APIへのサーバー側リクエストでは、このURLを`Origin`と`Referer`へ使用します。

依存関係をインストールして開発サーバーを起動します。

```bash
pnpm install
pnpm dev
```

ブラウザで[http://localhost:3000](http://localhost:3000)を開きます。APIキーはRoute Handler内だけで利用され、ブラウザには送信されません。

確認コマンドは`pnpm check`です。
