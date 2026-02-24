# Desktop Installation & User Guide
## Computerized Legislative Tracking System - Maasim

This guide details how to install and run the Legislative System on a standalone desktop computer (Windows, Mac, or Linux) without needing a cloud server.

### 1. Prerequisites

Before you begin, ensure the computer has **Node.js** installed.
- Download **Node.js (LTS Version)** from: [https://nodejs.org/](https://nodejs.org/)
- Run the installer and follow the default prompts.
- To verify, open a Command Prompt (or Terminal) and type: `node -v`. You should see a version number (e.g., v18.x.x or v20.x.x).

### 2. Setup the Application Folder

1.  **Download/Copy** the application source code folder to your desired location (e.g., `C:\LegislativeSystem` or `Documents/LegislativeSystem`).
2.  **Open the folder** in your File Explorer.

### 3. Configuration (API Key)

For the AI features (Drafting, Summarization) to work, you need a Google Gemini API Key.

1.  Look for a file named `.env` in the root folder.
2.  If it doesn't exist, create a new text file named `.env` (no .txt extension).
3.  Open it with Notepad and add your key:
    ```env
    API_KEY=your_actual_google_gemini_api_key_here
    ```
4.  Save the file.

### 4. First-Time Installation

You only need to do this once.

1.  Open the application folder.
2.  **Windows:** Right-click inside the folder (in an empty space) and select "Open in Terminal" or "Open PowerShell window here".
    - Alternatively, type `cmd` in the address bar and press Enter.
3.  Run the following command to install system libraries:
    ```bash
    npm install
    ```
4.  Wait for the installation to complete.

### 5. Building the System

This prepares the application for use. You must run this command initially, and whenever you change the API Key or code.

1.  In the same terminal/command window, run:
    ```bash
    npm run build
    ```
2.  Wait for the process to finish. It will create a `dist` folder.

### 6. Running the Application

**Option A: Using the Launcher Scripts (Recommended)**
- **Windows:** Double-click the `start_app.bat` file.
- **Mac/Linux:** Open terminal and run `./start_app.sh`.

**Option B: Manual Start**
1.  Open a terminal in the folder.
2.  Run:
    ```bash
    npm start
    ```

### 7. Accessing the System

Once the server is running, it will display a message like:
```
[SYSTEM] Server running on port 8080
[SYSTEM] Local URL: http://localhost:8080
```

1.  Open your web browser (Chrome, Edge, Firefox).
2.  Go to: **http://localhost:8080**

### 8. Data Storage

- All your data (Resolutions, Ordinances, etc.) is stored locally in a file named `local_database.json` inside the application folder.
- **Backup:** To backup your data, simply copy `local_database.json` to a safe location (like a USB drive).
- **Restore:** To restore, paste your backup `local_database.json` into the folder (ensure the app is closed first).

### Troubleshooting

- **"Command not found"**: Ensure Node.js is installed.
- **AI not working**: Check your internet connection and ensure your `API_KEY` in `.env` is correct. If you changed the key, run `npm run build` again.
- **Port in use**: If port 8080 is taken, you can change the port by editing the `.env` file and adding `PORT=3000` (or any other number).
