
class Ticket {
  final String id;
  final String purpose;
  final String status;
  final String timestamp;
  final List<TicketMessage> chatHistory;

  Ticket({
    required this.id,
    required this.purpose,
    required this.status,
    required this.timestamp,
    required this.chatHistory,
  });

  factory Ticket.fromJson(Map<String, dynamic> json) {
    var list = json['chatHistory'] as List? ?? [];
    List<TicketMessage> historyList = list.map((i) => TicketMessage.fromJson(i)).toList();

    return Ticket(
      id: json['id'],
      purpose: json['purpose'],
      status: json['status'],
      timestamp: json['timestamp'] ?? DateTime.now().toIso8601String(),
      chatHistory: historyList,
    );
  }
}

class TicketMessage {
  final String sender;
  final String text;
  final String? pdfUrl;
  final String timestamp;

  TicketMessage({
    required this.sender,
    required this.text,
    this.pdfUrl,
    required this.timestamp,
  });

  factory TicketMessage.fromJson(Map<String, dynamic> json) {
    return TicketMessage(
      sender: json['sender'],
      text: json['text'],
      pdfUrl: json['pdfUrl'],
      timestamp: json['timestamp'] ?? DateTime.now().toIso8601String(),
    );
  }
}
