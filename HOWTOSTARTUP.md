# How to start Up (to locally test)

Assumes you already have both `main` and `dev` cloned, and already have `backend/env/.env` filled in.

## First time only — install deps in all three places

```
npm i
```

```
cd backend
npm i
cd ..
```

```
cd frontend
npm i
cd ..
```

## Every time you want to run it

From the repo root:

```
npm run dev
```

Starts backend + frontend together

Other options, also from repo root:

```
npm run frontend
```

Starts **only** the frontend

```
npm run backend
```

Starts **only** the backend, with autorefresh (nodemon).

## Confirm it's running

Backend:
```
curl http://localhost:4000/ping
```
Should return `Pong!`.

Frontend:
Open `http://localhost:5173` in a browser

