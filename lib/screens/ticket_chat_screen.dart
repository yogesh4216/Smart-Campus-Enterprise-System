
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../models/ticket_model.dart';

class TicketChatScreen extends StatefulWidget {
  final Ticket ticket;
  const TicketChatScreen({super.key, required this.ticket});

  @override
  State<TicketChatScreen> createState() => _TicketChatScreenState();
}

class _TicketChatScreenState extends State<TicketChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  late Ticket _currentTicket;
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _currentTicket = widget.ticket;
    _startPolling();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      _refreshTicket();
    });
  }

  Future<void> _refreshTicket() async {
    final tickets = await ApiService.getTickets();
    if (tickets.isEmpty) return;
    try {
      final updated = tickets.firstWhere((t) => t.id == _currentTicket.id, orElse: () => _currentTicket);
      if (mounted) {
        setState(() {
          _currentTicket = updated;
        });
      }
    } catch (e) {
      // Ticket might not exist anymore or error in fetch
    }
  }

  void _sendMessage() async {
    if (_controller.text.trim().isEmpty) return;
    
    final text = _controller.text;
    _controller.clear();
    
    // Call API with Ticket ID to reply
    await ApiService.sendMessage(text, ticketId: _currentTicket.id);
    _refreshTicket();
    _scrollToBottom();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      Future.delayed(const Duration(milliseconds: 100), () {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      });
    }
  }

  Future<void> _downloadPdf(String relativeUrl) async {
    // CHANGED: Use localhost for macOS
    final uri = Uri.parse("http://localhost:3000$relativeUrl");
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Could not open PDF")));
    }
  }

  String _formatTime(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      return DateFormat('MMM d, h:mm a').format(dt);
    } catch (e) {
      return "";
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Ticket ${_currentTicket.id}', style: const TextStyle(fontSize: 16)),
            Text(_currentTicket.status, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal)),
          ],
        ),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16.0),
              itemCount: _currentTicket.chatHistory.length,
              itemBuilder: (context, index) {
                final msg = _currentTicket.chatHistory[index];
                final isUser = msg.sender == 'User';
                final isAdmin = msg.sender == 'Admin';
                
                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 8.0),
                    padding: const EdgeInsets.all(12.0),
                    decoration: BoxDecoration(
                      color: isUser ? Colors.deepPurple : (isAdmin ? Colors.orange[50] : Colors.grey[200]),
                      borderRadius: BorderRadius.circular(12),
                      border: isAdmin ? Border.all(color: Colors.orange.shade200) : null,
                      boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4, offset: const Offset(0, 2))],
                    ),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            if (!isUser) 
                              Text(msg.sender, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: isAdmin ? Colors.deepOrange : Colors.black54)),
                            if (isUser) const SizedBox(width: 20),
                            Text(_formatTime(msg.timestamp), style: TextStyle(fontSize: 9, color: isUser ? Colors.white70 : Colors.grey)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(msg.text, style: TextStyle(color: isUser ? Colors.white : Colors.black87)),
                        if (msg.pdfUrl != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 10.0),
                            child: SizedBox(
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                onPressed: () => _downloadPdf(msg.pdfUrl!),
                                icon: const Icon(Icons.download_rounded, size: 18),
                                label: const Text("Download Certificate"),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white, 
                                  foregroundColor: Colors.deepPurple,
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                ),
                              ),
                            ),
                          )
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          if (_currentTicket.status != 'Approved' && _currentTicket.status != 'Rejected' && _currentTicket.status != 'Resolved')
          Container(
            padding: const EdgeInsets.all(8.0),
            color: Colors.white,
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      decoration: InputDecoration(
                        hintText: "Reply...",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(24.0), borderSide: BorderSide.none),
                        filled: true,
                        fillColor: Colors.grey[200],
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  IconButton(icon: const Icon(Icons.send, color: Colors.deepPurple), onPressed: _sendMessage),
                ],
              ),
            ),
          )
          else
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Center(child: Text("Ticket is ${_currentTicket.status}", style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey))),
            )
        ],
      ),
    );
  }
}
