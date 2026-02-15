
# Server Bridge Final Setup Guide

If the app says "Connection Refused," the Windows Firewall or "Mark of the Web" security is usually the hidden blocker.

### 1. Identify the Correct IP
1.  Close your current CMD window.
2.  Start it again: `node server.js`
3.  Look for the lines starting with `➜ http://...`
4.  **Try all of them.** One might be for WiFi, another for Ethernet.

### 2. Force Open Port 3001 (Firewall Fix)
If you still can't connect, run this on the **Server Laptop**:
1.  Search for `PowerShell` in the Start Menu.
2.  Right-click it and select **Run as Administrator**.
3.  Copy and paste this exact command and press Enter:
    ```powershell
    New-NetFirewallRule -DisplayName "LegislativeBridge" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
    ```

### 3. FIX: "File could not be accessed"
This happens because Windows blocks scripts downloaded from the internet.
1.  Locate `Setup_Legislative_System.bat` in your **Downloads** folder.
2.  **Right-click** the file.
3.  Select **Properties**.
4.  At the bottom of the window, look for a section called **Security**.
5.  Check the box that says **Unblock**.
6.  Click **Apply** and then **OK**.
7.  Now, double-click the file to run it. It will find Chrome and create your icon.

### 4. Chrome App Settings
If the icon opens but shows a standard browser window (with tabs):
1.  Click the **Lock icon** 🔒 next to the address in the browser.
2.  Go to **Site settings**.
3.  Find **Insecure content** and set it to **Allow**.
4.  **REFRESH** the page.

---

### 5. Connecting to Supabase (Cloud Database)

To sync your data to the cloud so it can be accessed from anywhere:

1.  **Get Connection String:**
    *   Go to Supabase Dashboard -> Project Settings -> Database.
    *   Under "Connection string", select "Node.js".
    *   Copy the string (it looks like `postgres://postgres.xxxx:[password]@aws-0-region.pooler.supabase.com:5432/postgres`).
    *   *Note: Replace `[password]` with your actual database password.*

2.  **Create Tables:**
    *   Copy the content of the file `db_schema.sql` from this project.
    *   Paste it into the **SQL Editor** in your Supabase Dashboard and click **Run**.

3.  **Configure Server:**
    *   **If using Vercel:** Go to Settings -> Environment Variables. Add a new variable named `DATABASE_URL` and paste your connection string. Redeploy.
    *   **If running locally:**
        *   Stop the server.
        *   Set the variable and run:
            *   **CMD:** `set DATABASE_URL=your_connection_string&& node server.js`
            *   **PowerShell:** `$env:DATABASE_URL="your_connection_string"; node server.js`

4.  **Verify:**
    *   Restart the app. The "Cloud Gateway" status in Settings should show "ONLINE SYNC".
