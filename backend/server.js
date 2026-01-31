require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.json());
// Serve static files (PDFs)
app.use('/public', express.static(path.join(__dirname, 'public')));

// --- DATA STORE (In-Memory) ---
const users = [
    { id: "USR-ADMIN", name: "Admin Officer", email: "admin@college.edu", password: "admin", role: "Admin", department: "Administration" },
    { id: "USR-IT", name: "IT Support", email: "it@college.edu", password: "it", role: "IT", department: "IT Services" },
    // Pre-seed a student for testing convenience (ALICE from earlier tests is preserved if needed, but here is the main one)
    { id: "USR-ALICE", name: "Alice Student", email: "alice@test.com", password: "pass", role: "Student", studentId: "CS-2024-001", department: "CSE" },
    { id: "USR-ACCOUNTS", name: "Accounts Officer", email: "accounts@college.edu", password: "acc", role: "Accounts", department: "Finance" }
];

/*
 Ticket Structure:
 {
    id: string,
    userId: string,
    studentName: string, 
    studentId: string,
    department: string,
    requestType: string, // NEW: 'BONAFIDE', 'FEE_RECEIPT', 'WIFI', 'ID_CARD', 'OTHER'
    purpose: string,
    status: string,
    timestamp: string,
    chatHistory: [ { sender: "User"|"System"|"Admin", text: "...", pdfUrl?: "..." } ]
 }
*/
const requests = [];

const generateId = (prefix) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

// --- AUTH ENDPOINTS ---
app.post('/api/auth/register', (req, res) => {
    const { name, studentId, department, email, password } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: "Missing fields" });
    if (users.find(u => u.email === email)) return res.status(400).json({ error: "User exists" });

    const newUser = {
        id: `USR-${Math.floor(10000 + Math.random() * 90000)}`,
        name, studentId, department, email, password, role: "Student"
    };
    users.push(newUser);
    res.json(newUser);
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) res.json(user);
    else res.status(401).json({ error: "Invalid credentials" });
});

// --- HELPER: PDF GENERATION ---
const generateDocument = (ticket, user) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const filename = `${ticket.requestType}_${ticket.id}.pdf`;
        const filepath = path.join(__dirname, 'public', 'certificates', filename);

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Common Header
        doc.fontSize(20).text('ONE COLLEGE OF ENGINEERING', { align: 'center' });
        doc.fontSize(10).text('123 Education Lane, Knowledge City', { align: 'center' });
        doc.moveDown(2);

        if (ticket.requestType === 'FEE_RECEIPT') {
            // FEE RECEIPT TEMPLATE
            doc.fontSize(18).text('OFFICIAL FEE RECEIPT', { align: 'center', underline: true });
            doc.moveDown(2);

            doc.fontSize(12).text(`Receipt No: ${ticket.id}`);
            doc.text(`Date: ${new Date().toLocaleDateString()}`);
            doc.moveDown();

            doc.text(`Received from Mr./Ms. ${user.name} (${user.studentId})`);
            doc.text(`Department: ${user.department}`);
            doc.moveDown();

            doc.text(`Purpose of Payment: ${ticket.purpose || "Semester Fees"}`);
            doc.moveDown(2);

            doc.rect(50, 250, 500, 30).stroke(); // Box
            doc.fontSize(14).text("PAYMENT STATUS: PAID", 60, 260, { align: 'center', color: 'green' });

            doc.moveDown(4);

        } else {
            // BONAFIDE / GENERAL TEMPLATE
            doc.fontSize(18).text('BONAFIDE CERTIFICATE', { align: 'center', underline: true });
            doc.moveDown(2);

            let cleanPurpose = ticket.purpose?.replace(/i need a?n? ?(bonafide)? ?(certificate)?/gi, "").trim() || "General Purpose";
            if (cleanPurpose.length < 3) cleanPurpose = "General Administrative Purpose";

            doc.fontSize(12).text(`This is to certify that Mr./Ms. ${user.name} (Reg No: ${user.studentId}) is a bona fide student of this institution, studying in the Department of ${user.department}.`, {
                align: 'justify'
            });
            doc.moveDown();
            doc.text(`This certificate is issued on request for the purpose of: ${cleanPurpose}`);
            doc.moveDown(4);
        }

        // Footer
        doc.text('Authorized Signatory', { align: 'right' });
        doc.fontSize(8).text('(Digitally Generated)', { align: 'right' });

        doc.end();

        stream.on('finish', () => resolve(filename));
        stream.on('error', reject);
    });
};

// --- IBM WATSON ORCHESTRATE INTEGRATION ---
// Secrets loaded from .env
const IBM_API_KEY = process.env.IBM_API_KEY;
const IBM_ASSISTANT_ID = process.env.IBM_ASSISTANT_ID;
const IBM_SERVICE_URL = process.env.IBM_SERVICE_URL;

const callWatsonOrchestrate = async (message, sessionId = null) => {
    if (!IBM_API_KEY || IBM_API_KEY === "YOUR_IBM_API_KEY_HERE") {
        console.warn("Security Warning: IBM_API_KEY is missing or invalid in .env");
        return {
            text: "System: AI Service credentials are not configured. Please contact Admin.",
            sessionId: null
        };
    }

    try {
        // 1. Get Token
        const tokenResp = await axios.post('https://iam.cloud.ibm.com/identity/token', null, {
            params: {
                grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
                apikey: IBM_API_KEY
            },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const accessToken = tokenResp.data.access_token;

        // ... (Rest of logic remains same, just ensuring no logging of keys) ...

        let currentSessionId = sessionId;
        if (!currentSessionId) {
            const sessionResp = await axios.post(`${IBM_SERVICE_URL}/v2/assistants/${IBM_ASSISTANT_ID}/sessions`, {}, {
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Ibm-Assistant-Version': '2021-06-14' }
            });
            currentSessionId = sessionResp.data.session_id;
        }

        const msgResp = await axios.post(`${IBM_SERVICE_URL}/v2/assistants/${IBM_ASSISTANT_ID}/sessions/${currentSessionId}/message`, {
            input: {
                'message_type': 'text',
                'text': message
            }
        }, {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Ibm-Assistant-Version': '2021-06-14' }
        });

        const outputText = msgResp.data.output.generic?.[0]?.text || "I understood, but I have no response text.";
        return { text: outputText, sessionId: currentSessionId };

    } catch (error) {
        // Safe Error Logging
        console.error("Watson API Error:", error.response?.status, error.response?.statusText);
        // Do NOT log error.response.data if it might contain tokens
        return { text: "I'm having trouble connecting to the AI assistant right now.", sessionId: null };
    }
};

// 1. Create Request or Reply
app.post('/api/chat', async (req, res) => {
    // structured payload: requestType is key
    const { message, userId, ticketId, requestType, purpose } = req.body;
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // A. EXPLICIT REPLY TO EXISTING TICKET
    if (ticketId) {
        const ticket = requests.find(r => r.id === ticketId);
        if (!ticket) return res.status(404).json({ error: "Ticket not found" });

        ticket.chatHistory.push({ sender: "User", text: message, timestamp: new Date().toISOString() });

        // Simple acknowledgment for reply, or call AI if needed for clarification
        ticket.chatHistory.push({ sender: "System", text: "Update received.", timestamp: new Date().toISOString() });

        if (ticket.status === "Waiting for Info") ticket.status = "In Progress";

        return res.json({ id: ticket.id, status: ticket.status, reply: "Update received." });
    }

    // B. NEW STRUCTURED REQUEST (Enterpise Flow)
    if (requestType) {
        let department = "Admin";
        let prefix = "ADM";
        let reply = "Request received.";

        switch (requestType) {
            case 'FEE_RECEIPT':
                department = "Accounts";
                prefix = "FIN"; // Finance
                reply = "Fee receipt request forwarded to Accounts Office.";
                break;
            case 'BONAFIDE':
                department = "Admin";
                prefix = "ADM";
                reply = "Bonafide request forwarded to Admin Office.";
                break;
            case 'WIFI':
            case 'LAB':
            case 'ID_CARD':
                department = "IT";
                prefix = "IT";
                reply = "Support ticket forwarded to IT Helpdesk.";
                break;
            default:
                department = "Admin"; // Fallback
                prefix = "GEN";
        }

        const newId = generateId(prefix);
        const newTicket = {
            id: newId,
            userId: user.id,
            studentName: user.name,
            studentId: user.studentId || "N/A",
            department: user.department || "General",
            requestType: requestType,
            purpose: purpose || message,
            status: "Submitted",
            timestamp: new Date().toISOString(),
            chatHistory: [
                { sender: "User", text: `Requested: ${requestType}\nPurpose: ${purpose || message}`, timestamp: new Date().toISOString() },
                { sender: "System", text: `[${newId}] ${reply}`, timestamp: new Date().toISOString() }
            ]
        };
        requests.push(newTicket);
        return res.json({ id: newId, status: "Submitted", reply: reply });
    }

    // C. UNSTRUCTURED / CHAT (AI Fallback)
    const reply = "Please use the 'New Request' button to submit an official request (Bonafide, Fee Receipt, etc.).";
    // We could call callWatsonOrchestrate(message) here if we wanted chat support.

    return res.json({ id: null, status: "Chat", reply: reply });
});

// 2. Admin/Office Action
app.post('/api/admin/action', async (req, res) => {
    const { requestId, action, reason, missingInfo } = req.body;
    const ticket = requests.find(r => r.id === requestId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const user = users.find(u => u.id === ticket.userId);

    if (action === 'Approve') {
        ticket.status = "Approved";

        // Generate Correct Document based on Request Type
        try {
            const filename = await generateDocument(ticket, user);
            const pdfUrl = `/public/certificates/${filename}`;

            ticket.chatHistory.push({
                sender: ticket.requestType === 'FEE_RECEIPT' ? "Accounts" : "Admin",
                text: `Your ${ticket.requestType} has been generated. Download below.`,
                pdfUrl: pdfUrl,
                timestamp: new Date().toISOString()
            });

        } catch (e) {
            console.error("PDF Gen Error:", e);
            return res.status(500).json({ error: "Failed to generate Document" });
        }

    } else if (action === 'Reject') {
        ticket.status = "Rejected";
        ticket.chatHistory.push({
            sender: "System",
            text: `Request REJECTED. Reason: ${reason}`,
            timestamp: new Date().toISOString()
        });

    } else if (action === 'RequestInfo') {
        ticket.status = "Waiting for Info";
        ticket.chatHistory.push({
            sender: "System",
            text: `Info Required: ${missingInfo}`,
            timestamp: new Date().toISOString()
        });
    }

    res.json({ success: true, status: ticket.status });
});

// 3. Get Requests
app.get('/api/requests', (req, res) => res.json(requests));

// 4. Get Ticket Details (Polling)
app.get('/api/requests/:userId', (req, res) => {
    // Return all tickets for user, including full chat history
    const userTickets = requests.filter(r => r.userId === req.params.userId);
    res.json(userTickets);
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on port ${PORT}`);
});
