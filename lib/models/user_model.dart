
class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? studentId;
  final String? department;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.studentId,
    this.department,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      role: json['role'] ?? 'Student',
      studentId: json['studentId'],
      department: json['department'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'studentId': studentId,
      'department': department,
    };
  }
}
