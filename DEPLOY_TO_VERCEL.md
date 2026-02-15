
# How to Deploy to Vercel

This application is configured to run seamlessly on Vercel as a "Monorepo" (Frontend + Backend in one).

### Prerequisites
1.  **Supabase Account**: You must have your Supabase Connection String ready.
    *   *Format*: `postgres://postgres.user:[password]@aws-0-region.pooler.supabase.com:5432/postgres` (Use the Transaction/Session Pooler string if possible, often port 6543 or 5432).
2.  **Google Gemini API Key**: For the AI features.
3.  **GitHub/GitLab/Bitbucket Account**: To host your code repository.

---

### Step 1: Push Code to Repository
1.  Initialize git if not done: `git init`
2.  Add all files: `git add .`
3.  Commit: `git commit -m "Ready for deployment"`
4.  Push to your GitHub repository.

### Step 2: Import to Vercel
1.  Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your git repository.

### Step 3: Configure Project Settings
In the Vercel Import screen, verify these settings:

*   **Framework Preset**: `Vite`
*   **Root Directory**: `./` (Leave default)
*   **Build Command**: `npm run build`
*   **Output Directory**: `dist`

### Step 4: Environment Variables (CRITICAL)
Expand the **"Environment Variables"** section and add:

| Variable Name | Value |
| :--- | :--- |
| `DATABASE_URL` | Your Supabase connection string (e.g., `postgres://...`) |
| `API_KEY` | Your Google Gemini API Key |

*Note: You do not need to set `PORT` or other server configs. Vercel handles this.*

### Step 5: Deploy
1.  Click **Deploy**.
2.  Wait for the build to finish.
3.  Once deployed, visit your new URL (e.g., `https://maasim-legislative.vercel.app`).

### Step 6: Verify Connection
1.  Open the app in your browser.
2.  Log in (Default: `angel` / `ii88`).
3.  Go to **Settings** -> **Database & Security**.
4.  The "Cloud Gateway" status should say **ONLINE SYNC** / **CONNECTED**.
    *   *Note: You do NOT need to type a URL in the settings box. It connects automatically.*

---

### Troubleshooting

**Status says "OFFLINE"**
1.  Check your Vercel Logs (Dashboard -> Your Project -> Logs).
2.  Look for "Database Error".
3.  Ensure you created the tables in Supabase using the code in `db_schema.sql`.
4.  Ensure your `DATABASE_URL` in Vercel settings is correct and includes the password.

**"Mixed Content" Error**
*   Vercel forces HTTPS. Ensure you are accessing the site via `https://`.

**AI Features Not Working**
*   Check that `API_KEY` is set in Vercel Environment Variables.
