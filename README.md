# BillFlow IDOR/BOLA Lab (REST + SQLite)

BillFlow is a deliberately vulnerable API lab focused on `Broken Object Level Authorization` (BOLA/IDOR) in a realistic billing and orders scenario.

This project is designed for manual auditing practice with browser DevTools and Burp Suite, not for production use.

<img width="1918" height="946" alt="Captura de pantalla 2026-03-05 112157" src="https://github.com/user-attachments/assets/b97ab41e-66c5-448b-9c73-ff328ebe7439" />
<img width="1916" height="950" alt="Captura de pantalla 2026-03-05 112209" src="https://github.com/user-attachments/assets/063a9cc8-9dd7-4114-a3e2-36d6b26881dc" />
<img width="1918" height="947" alt="Captura de pantalla 2026-03-05 112216" src="https://github.com/user-attachments/assets/b893e483-d633-4b73-a315-fdf567816f43" />
<img width="1917" height="948" alt="Captura de pantalla 2026-03-05 112225" src="https://github.com/user-attachments/assets/15a14621-7dc7-49d4-af84-f95aaef8a0b6" />
<img width="1895" height="949" alt="Captura de pantalla 2026-03-05 112236" src="https://github.com/user-attachments/assets/4e41e4f1-15b4-4b3b-baac-a79a2d273c99" />
<img width="1916" height="947" alt="Captura de pantalla 2026-03-05 112252" src="https://github.com/user-attachments/assets/09de40d1-ca98-43ef-9ff0-8b1fad1d250d" />

## Disclaimer

This repository is intentionally insecure for educational purposes.

- Do not deploy this code to the public internet.
- Do not reuse this architecture as a production baseline.
- Use only in local or controlled lab environments.

## What this lab teaches

The core idea is simple:

- Authentication can be valid (JWT is required).
- Authorization can still be broken at object level.

The app contains two API styles:

- `Safe app endpoints` under `/api/my/*` that use `req.user.id`.
- `Vulnerable direct object endpoints` under `/api/*/:id` that resolve by object id only.

This lets you demonstrate:

- Horizontal IDOR read (`viewing another user data`).
- Horizontal IDOR write (`modifying another user data`).
- Document exposure (`invoice PDF download`).
- Obfuscation trap (`Base64 invoice ids are not authorization`).

## Data model in scope

- `profiles`: personal/fiscal profile data.
- `addresses`: shipping and billing addresses.
- `orders`: transactional purchase records.
- `invoices`: fiscal records and billing snapshot.
- `invoice pdf`: downloadable files tied to invoices.

## Technology stack

- Node.js + Express
- SQLite (`sqlite3` + `sqlite`)
- JWT (`jsonwebtoken`)
- React + Vite SPA

## Project structure

- `src/server.js`: server bootstrap
- `src/app.js`: app composition (middlewares + routes)
- `src/routes/auth.routes.js`: login
- `src/routes/health.routes.js`: health endpoint
- `src/routes/vulnerable.routes.js`: app endpoints + vulnerable object endpoints
- `src/middleware/auth.js`: JWT auth middleware
- `src/db/setup.js`: SQLite schema + seed
- `src/db/connection.js`: DB instance access
- `src/utils/request.js`: id/limit helpers
- `src/utils/obfuscation.js`: Base64 invoice id helpers
- `client/`: React frontend
- `data/billflow.sqlite`: local SQLite file

## Main endpoints

Auth:

- `POST /auth/login`

App endpoints (`/api/my/*`):

- `GET /api/my/profile`
- `PUT /api/my/profile`
- `GET /api/my/addresses`
- `POST /api/my/addresses`
- `PUT /api/my/addresses/:id`
- `GET /api/my/orders?limit=5`
- `GET /api/my/invoices?limit=3`

Direct object endpoints (intentionally vulnerable):

- `GET /api/profiles/:id`
- `GET /api/addresses/:id`
- `PUT /api/addresses/:id`
- `GET /api/orders/:id`
- `PUT /api/orders/:id`
- `GET /api/invoices/:id`
- `GET /api/invoices/:id/pdf`

Note: invoice object ids are Base64 in URL (`1 -> MQ==`, `2 -> Mg==`).

## Quick start

Install dependencies:

```bash
npm install
```

Development mode (separate ports):

```bash
npm start
npm run client
```

- API: `http://localhost:3000`
- Frontend: `http://localhost:5173`

Single-port mode (recommended for server deployment):

```bash
npm run client:build
npm start
```

- UI + API served from `http://<HOST>:3000`

## Tested environment

This lab was validated end-to-end on `Ubuntu Server` running in a virtual machine.  
That VM setup was the primary hosting and testing environment.

<img width="1271" height="793" alt="Captura de pantalla 2026-03-05 161048" src="https://github.com/user-attachments/assets/82a0880c-2586-46bd-816b-0998432cf93c" />

## Demo credentials

- `demo_a / demo123`
- `victim_b / victim123`
- `admin / admin123`

## Learning roadmap (short)

1. Login as `demo_a`.
2. Confirm your own data using `/api/my/*`.
3. Change object id in direct endpoints (`/api/orders/:id`, `/api/addresses/:id`, `/api/invoices/:id`).
4. Observe unauthorized access and write impact.
5. Download another user invoice PDF.

## Fix concept (no patch code)

Vulnerable pattern:

```sql
SELECT * FROM invoices WHERE id = ?
```

Correct authorization pattern:

```sql
SELECT * FROM invoices WHERE id = ? AND user_id = ?
```

Same principle applies to `UPDATE`/`DELETE`.

## Notes

- This repo is intentionally focused on manual API auditing, not fuzzing.
- The full walkthrough and exploitation narrative is covered in video.

## Visual guide

If you prefer a visual walkthrough over written steps, there is also a video series covering BOLA/IDOR using this lab context.

[![IDOR en APIs: explotarlo, entenderlo y corregirlo en el código](https://img.youtube.com/vi/WsT0fWSBJwU/hqdefault.jpg)](http://www.youtube.com/watch?v=WsT0fWSBJwU "IDOR en APIs: explotarlo, entenderlo y corregirlo en el código")

## Credits

Developed by Jesus Caldera.  
Also fair to admit there was a little bit of Codex involved during development.

## License and liability

Permission to use, copy, modify, and distribute this software and its
documentation for any purpose and without fee is hereby granted,
provided that the above copyright notice appear in all copies and that
both that copyright notice and this permission notice appear in
supporting documentation.

THE AUTHOR PROVIDES THIS SOFTWARE ''AS IS'' AND ANY EXPRESSED OR
IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
