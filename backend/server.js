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
// ... (Rest of Setup) ...

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
