
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../models/ticket_model.dart';
import 'ticket_chat_screen.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Ticket> _tickets = [];
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _fetchTickets();
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (timer) => _fetchTickets());
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchTickets() async {
    final tickets = await ApiService.getTickets();
    if (mounted) {
      setState(() => _tickets = tickets);
    }
  }

  void _showCreateRequestDialog() {
    final purposeController = TextEditingController();
    String? selectedType;
    final List<String> requestTypes = ['BONAFIDE', 'FEE_RECEIPT', 'WIFI', 'ID_CARD', 'LAB', 'OTHER'];

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) {
          return AlertDialog(
            title: const Text("New Request"),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(labelText: 'Request Type', border: OutlineInputBorder()),
                  items: requestTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                  onChanged: (v) => setState(() => selectedType = v),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: purposeController,
                  decoration: const InputDecoration(
                    labelText: 'Purpose / Details',
                    hintText: "e.g., Scholarship application",
                    border: OutlineInputBorder()
                  ),
                  maxLines: 3,
                ),
              ],
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text("Cancel")),
              ElevatedButton(
                onPressed: () async {
                  if (selectedType != null && purposeController.text.isNotEmpty) {
                    Navigator.pop(context);
                    
                    // Send Structured Payload
                    await ApiService.sendMessage(
                      purposeController.text, // Message is purpose for now
                      requestType: selectedType,
                      purpose: purposeController.text
                    );
                    
                    _fetchTickets();
                  }
                },
                child: const Text("Submit"),
              )
            ],
          );
        }
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved': case 'resolved': return Colors.green;
      case 'rejected': return Colors.red;
      case 'submitted': return Colors.orange;
      default: return Colors.blue;
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ApiService.currentUser;
    return Scaffold(
      appBar: AppBar(
        title: const Text("Smart Campus"),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        actions: [
          IconButton(icon: const Icon(Icons.logout), onPressed: () {
            ApiService.logout();
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (c) => const LoginScreen()));
          })
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateRequestDialog,
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text("New Request"),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text("Welcome, ${user?.name ?? 'Student'}", style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0),
            child: Text("Your History", style: TextStyle(fontSize: 16, color: Colors.grey)),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: _tickets.isEmpty 
              ? const Center(child: Text("No requests yet.\nTap 'New Request' to start.", textAlign: TextAlign.center))
              : RefreshIndicator(
                  onRefresh: _fetchTickets,
                  child: ListView.builder(
                    itemCount: _tickets.length,
                    itemBuilder: (context, index) {
                      final t = _tickets[index];
                      // Format Date
                      final date = DateTime.parse(t.timestamp).toLocal();
                      final dateStr = DateFormat('MMM d, yyyy').format(date);

                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: ListTile(
                          onTap: () {
                            Navigator.push(context, MaterialPageRoute(builder: (c) => TicketChatScreen(ticket: t)));
                          },
                          leading: CircleAvatar(
                            backgroundColor: _getStatusColor(t.status).withOpacity(0.1),
                            child: Icon(Icons.assignment, color: _getStatusColor(t.status)),
                          ),
                          title: Text(t.purpose, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text("${t.id} • $dateStr"),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(t.status, style: TextStyle(color: _getStatusColor(t.status), fontWeight: FontWeight.bold, fontSize: 12)),
                              const Icon(Icons.chevron_right, size: 16, color: Colors.grey),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
          ),
        ],
      ),
    );
  }
}
