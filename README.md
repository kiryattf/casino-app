# Telegram Casino Mini App (Modular Architecture)

A full-stack, state-of-the-art Telegram Mini App casino with Crash, Plinko, and Mines games.

## Setup Instructions for CachyOS (Linux)

1. **Ensure Python & Git are installed:**
   ```bash
   sudo pacman -Syu python git python-virtualenv
   ```

2. **Navigate to the core directory:**
   ```bash
   cd casino-app
   ```

3. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

4. **Install backend dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure the environment:**
   Edit the `.env` file in the project root:
   ```env
   BOT_TOKEN=your_telegram_bot_token_here
   WEBAPP_URL=https://<your_github_username>.github.io/casino-app/web/index.html
   ```

6. **Deploy the Frontend:**
   - Push the repository to GitHub.
   - Go to your repository settings on GitHub -> Pages.
   - Set the source to the `main` branch, under the `/` (root) folder, or select GitHub Actions.
   - Take the GitHub Pages URL and point it to the `/web/index.html` file in your `.env`.

7. **Run the Backend:**
   ```bash
   python bot/main.py
   ```
