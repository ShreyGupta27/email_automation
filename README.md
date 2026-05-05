# EmailFlow - Cold Email Automation Platform

A powerful, local-first cold email outreach automation tool with AI-powered personalization, multi-step sequences, and built-in analytics.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation & Setup

**Step 1: Install Dependencies**
```bash
npm install
```

**Step 2: Start the Application**

Option A - Run both frontend and backend together:
```bash
npm run dev:full
```

Option B - Run in separate terminals:
```bash
# Terminal 1: Start backend server
npm run server

# Terminal 2: Start frontend (in a new terminal)
npm start
```

The app will open at `http://localhost:3000`

## 📊 Database Setup

**No manual setup required!** The database is automatically created on first run:

- **Database Type:** SQLite (local file-based)
- **Location:** `recipients.db` (created in project root)
- **Auto-initialization:** Database schema is created automatically when the backend starts
- **Data Persistence:** All recipient data persists indefinitely in `recipients.db`

### What Gets Created:
- `recipients.db` - Contains all your recipient data, email sequences, and campaign history
- Automatically initialized with the required schema on first backend startup

### Important Notes:
- `recipients.db` is excluded from git (in `.gitignore`) to prevent committing user data
- Each clone of the project will have its own separate database
- Data is stored locally on your machine - no cloud sync

## 🔧 Features

### 1. **Create Email Sequences**
- Multi-step email campaigns with customizable delays
- Rich text editor with formatting, images, and links
- Schedule emails by time and day of week
- Pre-built templates for common outreach scenarios

### 2. **Manage Recipients**
- Add recipients manually or bulk import from CSV/Excel
- Store recipient details: name, email, designation, company, domain
- Search and filter recipients
- Delete individual or multiple recipients

### 3. **Analytics Dashboard**
- Track sequence performance metrics
- View active vs inactive sequences
- Analyze recipient distribution by domain
- Monitor delivery and reply rates

### 4. **Email Preview**
- Preview emails before sending
- See how emails will look to recipients
- Verify personalization variables

### 5. **AI Personalization** (requires n8n setup)
- Automatic email personalization using Google Gemini
- Personalize subject lines and content
- Support for variables: {{firstName}}, {{lastName}}, {{companyName}}, {{domain}}, {{designation}}

## 🔌 n8n Integration

To enable actual email sending with AI personalization:

### Setup Steps:

1. **Install n8n locally:**
   ```bash
   npm install -g n8n
   n8n start
   ```
   n8n will run on `http://localhost:5678`

2. **Configure Gmail OAuth2 in n8n:**
   - Go to n8n Credentials
   - Create new "Gmail OAuth2" credential
   - Authenticate with your Gmail account
   - Copy the credential ID

3. **Configure Google Gemini API in n8n:**
   - Go to n8n Credentials
   - Create new "Google Gemini(PaLM) Api" credential
   - Add your Gemini API key
   - Copy the credential ID

4. **Update n8n_workflow.json:**
   - Open `n8n_workflow.json`
   - Replace `YOUR_GMAIL_CREDENTIAL_HERE` with your Gmail credential ID (lines 130, 196)
   - Replace `YOUR_GEMINI_CREDENTIAL_HERE` with your Gemini credential ID (lines 244, 276)

5. **Import Workflow:**
   - In n8n, go to Workflows
   - Click "Import from file"
   - Select `n8n_workflow.json`
   - The workflow will be ready to use

### What the Workflow Does:
- Receives email sequences from EmailFlow
- Personalizes emails using Google Gemini AI
- Sends emails via Gmail
- Handles scheduled delays between emails
- Supports multiple recipients in bulk


## 🔐 Security & Privacy

- **Local Storage:** All data stored locally on your machine
- **No Cloud:** No data sent to external servers (except when using n8n/Gmail/Gemini)
- **Database:** SQLite file-based database, excluded from git
- **Credentials:** Store API keys securely in n8n, never in code

## 📝 Available Scripts

### `npm start`
Runs the React frontend in development mode at `http://localhost:3000`

### `npm run server`
Runs the Express backend server at `http://localhost:3001`

### `npm run dev:full`
Runs both frontend and backend concurrently

### `npm run build`
Builds the React app for production

## 📚 Technologies Used

- **Frontend:** React, Tailwind CSS, Recharts
- **Backend:** Express.js, SQLite (sql.js)
- **Automation:** n8n (optional)
- **AI:** Google Gemini API (optional)
- **Email:** Gmail API (optional)


## Copyright

Copyright (c) 2026 Shrey Gupta. All rights reserved.

Unauthorized copying, modification, or distribution of this software, via any medium, is strictly prohibited.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
