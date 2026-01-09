import 'dart:convert';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class ApiException implements Exception {
  final String message;
  final int statusCode;

  ApiException(this.message, this.statusCode);

  @override
  String toString() => message;
}

class ApiService {
  String get baseUrl => AuthService.baseUrl;
  final AuthService _authService = AuthService();

  Future<Map<String, String>> _getHeaders() async {
    final token = await _authService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<http.Response> _makeRequest(
    String method,
    String url,
    {Map<String, String>? headers, String? body}
  ) async {
    final requestHeaders = headers ?? await _getHeaders();

    late http.Response response;

    switch (method.toUpperCase()) {
      case 'GET':
        response = await http.get(Uri.parse(url), headers: requestHeaders);
        break;
      case 'POST':
        response = await http.post(Uri.parse(url), headers: requestHeaders, body: body);
        break;
      case 'PUT':
        response = await http.put(Uri.parse(url), headers: requestHeaders, body: body);
        break;
      case 'DELETE':
        response = await http.delete(Uri.parse(url), headers: requestHeaders);
        break;
      default:
        throw ApiException('Unsupported HTTP method: $method', 0);
    }

    // If we get a 401, try to refresh the token and retry once
    if (response.statusCode == 401) {
      final refreshResult = await _authService.refreshToken();
      if (refreshResult?['success'] == true) {
        // Retry with new token
        final newHeaders = await _getHeaders();
        switch (method.toUpperCase()) {
          case 'GET':
            response = await http.get(Uri.parse(url), headers: newHeaders);
            break;
          case 'POST':
            response = await http.post(Uri.parse(url), headers: newHeaders, body: body);
            break;
          case 'PUT':
            response = await http.put(Uri.parse(url), headers: newHeaders, body: body);
            break;
          case 'DELETE':
            response = await http.delete(Uri.parse(url), headers: newHeaders);
            break;
        }
      }
    }

    return response;
  }

  Future<List<dynamic>> getDoctors() async {
    try {
      final response = await _makeRequest('GET', '$baseUrl/doctors');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['data']['doctors'];
        }
      } else if (response.statusCode == 401) {
        throw ApiException('Authentication failed. Please log in again.', 401);
      }
      throw ApiException('Failed to load doctors', response.statusCode);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: $e', 0);
    }
  }

  Future<List<dynamic>> getAppointments() async {
    try {
      final response = await _makeRequest('GET', '$baseUrl/appointments');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['data']['appointments'];
        }
      } else if (response.statusCode == 401) {
        throw ApiException('Authentication failed. Please log in again.', 401);
      }
      throw ApiException('Failed to load appointments', response.statusCode);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: $e', 0);
    }
  }

  Future<Map<String, dynamic>> sendChatMessage(String message) async {
    try {
      final response = await _makeRequest(
        'POST',
        '$baseUrl/chat/message',
        body: jsonEncode({'message': message}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['data']; // Expected to return response text/action
        }
      } else if (response.statusCode == 401) {
        throw ApiException('Authentication failed. Please log in again.', 401);
      }
      throw ApiException('Failed to send message: ${response.statusCode}', response.statusCode);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: $e', 0);
    }
  }
}
