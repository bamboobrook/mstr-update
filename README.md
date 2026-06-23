# MSTR Update

MSTR/Strategy treasury dashboard for LAN monitoring and scenario testing.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://10.0.0.134:8787` from the LAN after deployment on WSL.

## Production

```bash
npm run build
pm2 start npm --name mstr-update -- start
```

The app uses Strategy/SEC/public market sources first and stores snapshots in SQLite. If public pages fail, it keeps the latest cached value and marks the source as stale.
