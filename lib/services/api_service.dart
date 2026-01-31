
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/user_model.dart';
import '../models/ticket_model.dart';

class ApiService {
  // CHANGED: localhost is better for macOS execution
  static const String _baseUrl = 'http://localhost:3000/api';
  
  static User? _currentUser;
  static User? get currentUser => _currentUser;

  // Login
  static Future<User?> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _currentUser = User.fromJson(data);
        return _currentUser;
      }
      return null;
    } catch (e) {
      print("Login Error: $e");
      return null;
    }
  }

  // Register
  static Future<User?> register({
    required String name,
    required String studentId,
    required String department,
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': name,
          'studentId': studentId,
          'department': department,
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _currentUser = User.fromJson(data);
        return _currentUser;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Send Message
  static Future<Map<String, dynamic>> sendMessage(String message, {String? ticketId, String? requestType, String? purpose}) async {
    if (_currentUser == null) return {"status": "Auth Error"};

    try {
      final body = {
        'message': message,
        'userId': _currentUser!.id, 
      };
      if (ticketId != null) body['ticketId'] = ticketId;
      if (requestType != null) body['requestType'] = requestType;
      if (purpose != null) body['purpose'] = purpose;

      final response = await http.post(
        Uri.parse('$_baseUrl/chat'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 401) {
        return {"status": "Auth Error"};
      } else {
        return {"status": "Error", "reply": "Server Error"};
      }
    } catch (e) {
      return {"status": "Connection Fail"};
    }
  }

  // Get All Tickets
  static Future<List<Ticket>> getTickets() async {
    if (_currentUser == null) return [];

    try {
      final response = await http.get(Uri.parse('$_baseUrl/requests/${_currentUser!.id}'));
      
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        final tickets = data.map((json) => Ticket.fromJson(json)).toList();
        tickets.sort((a, b) => b.timestamp.compareTo(a.timestamp));
        return tickets;
      }
    } catch (e) {
      print("Get Tickets Error: $e");
    }
    return [];
  }

  static void logout() {
    _currentUser = null;
  }
}
