import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';
import '../models/models.dart';

class ApiService {
  static const _storage = FlutterSecureStorage();
  
  static Future<String?> getToken() async {
    return await _storage.read(key: 'token');
  }
  
  static Future<void> setToken(String token) async {
    await _storage.write(key: 'token', value: token);
  }
  
  static Future<void> clearToken() async {
    await _storage.delete(key: 'token');
  }
  
  static Future<Map<String, String>> _getHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
  
  // Auth
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('${AppConfig.apiUrl}/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    
    final data = jsonDecode(response.body);
    if (!response.statusCode.toString().startsWith('2')) {
      throw Exception(data['message'] ?? 'Login failed');
    }
    
    await setToken(data['data']['token']);
    return data['data'];
  }
  
  static Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    final response = await http.post(
      Uri.parse('${AppConfig.apiUrl}/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(userData),
    );
    
    final data = jsonDecode(response.body);
    if (!response.statusCode.toString().startsWith('2')) {
      throw Exception(data['message'] ?? 'Registration failed');
    }
    
    await setToken(data['data']['token']);
    return data['data'];
  }
  
  static Future<User> getProfile() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('${AppConfig.apiUrl}/auth/me'),
      headers: headers,
    );
    
    final data = jsonDecode(response.body);
    if (!response.statusCode.toString().startsWith('2')) {
      throw Exception(data['message'] ?? 'Failed to get profile');
    }
    
    return User.fromJson(data['data']['user']);
  }
  
  // Doctors
  static Future<List<Doctor>> getDoctors() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('${AppConfig.apiUrl}/doctors'),
      headers: headers,
    );
    
    final data = jsonDecode(response.body);
    if (!response.statusCode.toString().startsWith('2')) {
      throw Exception(data['message'] ?? 'Failed to fetch doctors');
    }
    
    return (data['data']['doctors'] as List)
        .map((d) => Doctor.fromJson(d))
        .toList();
  }
  
  // Appointments
  static Future<List<TimeSlot>> getSlots(String doctorId, String date) async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('${AppConfig.apiUrl}/appointments/slots/$doctorId?date=$date'),
      headers: headers,
    );
    
    final data = jsonDecode(response.body);
    if (!response.statusCode.toString().startsWith('2')) {
      throw Exception(data['message'] ?? 'Failed to fetch slots');
    }
    
    return (data['data']['slots'] as List)
        .map((s) => TimeSlot.fromJson(s))
        .toList();
  }
  
  static Future<Appointment> bookAppointment(Map<String, dynamic> appointmentData) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('${AppConfig.apiUrl}/appointments'),
      headers: headers,
      body: jsonEncode(appointmentData),
    );
    
    final data = jsonDecode(response.body);
    if (!response.statusCode.toString().startsWith('2')) {
      throw Exception(data['message'] ?? 'Failed to book appointment');
    }
    
    return Appointment.fromJson(data['data']['appointment']);
  }
  
  static Future<List<Appointment>> getAppointments({String? fromDate, String? toDate}) async {
    final headers = await _getHeaders();
    String url = '${AppConfig.apiUrl}/appointments';
    List<String> queryParams = [];

    if (fromDate != null) {
      queryParams.add('fromDate=$fromDate');
    }
    if (toDate != null) {
      queryParams.add('toDate=$toDate');
    }

    if (queryParams.isNotEmpty) {
      url += '?' + queryParams.join('&');
    }

    final response = await http.get(Uri.parse(url), headers: headers);

    final data = jsonDecode(response.body);
    if (!response.statusCode.toString().startsWith('2')) {
      throw Exception(data['message'] ?? 'Failed to fetch appointments');
    }

    return (data['data']['appointments'] as List)
        .map((a) => Appointment.fromJson(a))
        .toList();
  }
  
  static Future<void> cancelAppointment(String id) async {
    final headers = await _getHeaders();
    final response = await http.patch(
      Uri.parse('${AppConfig.apiUrl}/appointments/$id/cancel'),
      headers: headers,
      body: jsonEncode({}),
    );
    
    final data = jsonDecode(response.body);
    if (!response.statusCode.toString().startsWith('2')) {
      throw Exception(data['message'] ?? 'Failed to cancel appointment');
    }
  }
  
  // Voice
  static Future<Map<String, dynamic>> processVoiceCommand(String transcript) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('${AppConfig.apiUrl}/voice/process'),
      headers: headers,
      body: jsonEncode({'transcript': transcript}),
    );
    
    final data = jsonDecode(response.body);
    if (!response.statusCode.toString().startsWith('2')) {
      throw Exception(data['message'] ?? 'Failed to process voice command');
    }
    
    return data['data'];
  }
}
