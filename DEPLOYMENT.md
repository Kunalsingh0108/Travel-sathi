# Tripora deployment

## Render API

1. Create a new Render Blueprint from this repository.
2. Render will use `render.yaml` to create the `tripora-api` web service.
3. Set a strong `ADMIN_TOKEN` secret in the Render dashboard.
4. The service uses a persistent disk for the file-backed store.
5. Verify the API at `https://tripora-api.onrender.com/api/health`.

## Vercel client

1. Create a Vercel project from this repository.
2. Set the project root directory to `client`.
3. Vercel will run the client build and publish `client/dist`.
4. `client/vercel.json` proxies `/api/*` requests to the Render API.

If the Render service name is changed, update the destination URL in
`client/vercel.json` before deploying the client.

## GitHub Pages client

The repository includes `.github/workflows/deploy-pages.yml`. After enabling
GitHub Pages with **Settings → Pages → Source: GitHub Actions**, every push to
`main` publishes the client at:

`https://kunalsingh0108.github.io/Travel-sathi/`

The client uses hash-based routes, so refreshing pages works on GitHub Pages.
The workflow points API requests at the Render service.

## Local production checks

```powershell
npm run install:all
npm run test
npm run build
```
