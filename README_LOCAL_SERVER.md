# Local Server Setup

This application supports running with a **Local File-Based Database** when a cloud PostgreSQL database is not available. This is ideal for offline deployments or standalone local server use.

## How it Works

The server (`server.js`) automatically detects if a `DATABASE_URL` environment variable is present.

- **Cloud Mode:** If `DATABASE_URL` is set, it connects to the PostgreSQL database.
- **Local Mode:** If `DATABASE_URL` is **NOT** set, it switches to `LocalFileAdapter` and stores data in `local_database.json` in the root directory.

## Running Locally

1. **Build the Application:**
   ```bash
   npm run build
   ```

2. **Start the Server:**
   ```bash
   npm start
   ```
   
   The server will start on port `8080` (or the port defined in `PORT` env var).
   It will serve the frontend and the API.

3. **Access the App:**
   Open your browser to `http://localhost:8080` (or the appropriate port).

## Data Persistence

In Local Mode, all data (Resolutions, Ordinances, etc.) is saved to `local_database.json`. 
- This file is automatically created if it doesn't exist.
- **Backup:** You can simply copy this file to back up your data.
- **Restore:** Replace this file with a backup (while the server is stopped) to restore data.

## AI Functionality (Gemini)

The AI features (Summarization, Drafting, Transcription) **WILL work** in Local Server mode, but with the following requirements:

1. **Internet Connection Required:** The AI processing is cloud-based (Google Gemini). The device accessing the app must have an active internet connection. It does **not** run offline.
2. **API Key Configuration:** The `API_KEY` must be present in your `.env` file **before** you run `npm run build`.
   - The key is embedded into the frontend application during the build process.
   - If you change the key, you must rebuild the app (`npm run build`).

## Switching Modes

To switch back to Cloud Mode, simply set the `DATABASE_URL` environment variable and restart the server.
