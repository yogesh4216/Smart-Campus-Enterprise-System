# Smart Campus Enterprise System

An enterprise-grade campus service management system connecting Students, Administration, IT, and Accounts departments. The system leverages **IBM watsonx Orchestrate** for conversational AI support while maintaining strict, deterministic workflows for official document generation.

## 🚀 Key Features

### 1. Enterprise Role-Based Access Control (RBAC)
- **Students**: Request services (Bonafide, Fee Receipts, WiFi), chat with AI, and track ticket status via Mobile App.
- **Admin Office**: Review and approve general administrative requests (Bonafide Certificates).
- **Accounts Office**: Dedicated dashboard to verify payments and issue official Fee Receipts.
- **IT Support**: Manage technical support tickets (WiFi, ID Cards).

### 2. Deterministic Routing & Workflows
- **Strict Routing**: Requests are automatically routed based on type:
  - `FEE_RECEIPT` → **Accounts Department** (`FIN-xxxx`)
  - `BONAFIDE` → **Admin Department** (`ADM-xxxx`)
  - `WIFI/LAB` → **IT Department** (`IT-xxxx`)
- **Document Generation**: Automated, tamper-proof PDF generation for Bonafide Certificates and Fee Receipts upon approval.

### 3. AI Copilot (IBM watsonx Orchestrate)
- Acts as a **Conversational Support Layer**.
- Handles general inquiries (FAQ, Policy) via chat.
- *Note: Core business logic (approvals, document issuance) is handled by the backend, not the AI, ensuring 100% reliability.*

### 4. Secure Architecture
- **Zero-Trust**: No hardcoded secrets. All API keys and credentials are managed via environment variables (`.env`).
- **Segregation of Duties**: Accounts Dashboard is completely isolated from Admin views.

---

## 🛠 Tech Stack

- **Mobile App**: Flutter (Dart) - *Student Interface*
- **Backend**: Node.js, Express - *API & Orchestration Layer*
- **Web Dashboard**: React.js - *Office Admin Portals*
- **AI**: IBM watsonx Orchestrate - *Intelligent Assistant*

---

## 🔐 Security Configuration

This project follows enterprise security best practices. **No API keys are committed to the repository.**

### Setting up Credentials
1.  Navigate to the `backend/` directory.
2.  Copy the example env file:
    ```bash
    cp .env.example .env
    ```
3.  Edit `.env` and add your IBM credentials:
    ```ini
    IBM_API_KEY=your_ibm_api_key
    IBM_ASSISTANT_ID=your_assistant_id
    IBM_SERVICE_URL=https://au-syd.watson-orchestrate.cloud.ibm.com
    ```

---

## 🏃‍♂️ How to Run

### 1. Backend server
```bash
cd backend
npm install
node server.js
```
*Server runs on port 3000.*

### 2. Web Dashboard (Admin/Accounts)
```bash
cd web_dashboard
npm install
npm run dev
```
*Access at `http://localhost:5173`.*
*   **Admin Login**: `admin@college.edu` / `admin`
*   **Accounts Login**: `accounts@college.edu` / `acc`
*   **IT Login**: `it@college.edu` / `it`

### 3. Mobile App (Student)
```bash
flutter pub get
flutter run -d chrome  # or ios/android
```
*   **Student Login**: Created via "Register" in app (default: `alice@test.com` / `pass`).

---

## 📂 Project Structure

```
├── backend/           # Node.js API Server
│   ├── public/        # Generated PDFs
│   ├── server.js      # Core Logic & Routing
│   └── .env           # Secrets (Ignored by Git)
├── lib/               # Flutter Mobile App Code
│   ├── screens/       # UI Screens
│   └── services/      # API Integration
└── web_dashboard/     # React Admin Dashboards
    ├── src/pages/     # Dashboard Views (Admin, Accounts, IT)
    └── src/context/   # Auth Context
```
