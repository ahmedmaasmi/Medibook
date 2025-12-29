class User {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? phone;
  final String role;
  final bool isActive;

  User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.phone,
    required this.role,
    required this.isActive,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      email: json['email'],
      firstName: json['firstName'],
      lastName: json['lastName'],
      phone: json['phone'],
      role: json['role'],
      isActive: json['isActive'] ?? true,
    );
  }

  String get fullName => '$firstName $lastName';
  String get initials => '${firstName[0]}${lastName[0]}';
}

class Doctor {
  final String id;
  final String specialization;
  final String? bio;
  final double? consultationFee;
  final int? yearsOfExperience;
  final User user;

  Doctor({
    required this.id,
    required this.specialization,
    this.bio,
    this.consultationFee,
    this.yearsOfExperience,
    required this.user,
  });

  factory Doctor.fromJson(Map<String, dynamic> json) {
    return Doctor(
      id: json['id'],
      specialization: json['specialization'],
      bio: json['bio'],
      consultationFee: json['consultationFee']?.toDouble(),
      yearsOfExperience: json['yearsOfExperience'],
      user: User.fromJson(json['user']),
    );
  }
}

class Appointment {
  final String id;
  final String clientId;
  final String doctorId;
  final String appointmentDate;
  final String startTime;
  final String endTime;
  final String status;
  final String? reason;
  final String bookedVia;
  final Doctor? doctor;
  final User? client;

  Appointment({
    required this.id,
    required this.clientId,
    required this.doctorId,
    required this.appointmentDate,
    required this.startTime,
    required this.endTime,
    required this.status,
    this.reason,
    required this.bookedVia,
    this.doctor,
    this.client,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'],
      clientId: json['clientId'],
      doctorId: json['doctorId'],
      appointmentDate: json['appointmentDate'],
      startTime: json['startTime'],
      endTime: json['endTime'],
      status: json['status'],
      reason: json['reason'],
      bookedVia: json['bookedVia'] ?? 'mobile',
      doctor: json['doctor'] != null ? Doctor.fromJson(json['doctor']) : null,
      client: json['client'] != null ? User.fromJson(json['client']) : null,
    );
  }
}

class TimeSlot {
  final String startTime;
  final String endTime;
  final bool available;

  TimeSlot({
    required this.startTime,
    required this.endTime,
    required this.available,
  });

  factory TimeSlot.fromJson(Map<String, dynamic> json) {
    return TimeSlot(
      startTime: json['startTime'],
      endTime: json['endTime'],
      available: json['available'] ?? true,
    );
  }
}
