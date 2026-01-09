import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:jwt_decoder/jwt_decoder.dart';

class AuthService {
  // Use 10.0.2.2 for Android Emulator, localhost for iOS simulator/Web
  // For production, this should be your server's URL
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:3001/api';
    }
    // Android emulator
    return 'http://10.0.2.2:3001/api';
  }

  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String refreshTokenKey = 'refresh_token';
  static const String rememberMeKey = 'remember_me';

  Future<Map<String, dynamic>> login(String email, String password, {bool rememberMe = false}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        final token = data['data']['token'];
        final user = data['data']['user'];

        await _saveAuthData(token, user, rememberMe: rememberMe);
        return {'success': true, 'user': user};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Login failed',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  Future<Map<String, dynamic>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'firstName': firstName,
          'lastName': lastName,
          'email': email,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 201 && data['success'] == true) {
        final token = data['data']['token'];
        final user = data['data']['user'];
        
        await _saveAuthData(token, user);
        return {'success': true, 'user': user};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Registration failed',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  Future<void> _saveAuthData(String token, Map<String, dynamic> user, {bool rememberMe = false}) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(tokenKey, token);
    await prefs.setString(userKey, jsonEncode(user));
    await prefs.setBool(rememberMeKey, rememberMe);
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(tokenKey);
  }

  Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString(userKey);
    if (userStr != null) {
      return jsonDecode(userStr);
    }
    return null;
  }

  Future<bool> shouldRememberMe() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(rememberMeKey) ?? false;
  }

  Future<bool> isTokenExpired() async {
    final token = await getToken();
    if (token == null) return true;

    try {
      return JwtDecoder.isExpired(token);
    } catch (e) {
      // If token is invalid, consider it expired
      return true;
    }
  }

  Future<Map<String, dynamic>?> refreshToken() async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/auth/refresh'),
        headers: headers,
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        final newToken = data['data']['token'];
        final user = data['data']['user'];

        // Save the new token
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(tokenKey, newToken);

        return {'success': true, 'user': user};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Token refresh failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error during token refresh: $e'};
    }
  }

  Future<Map<String, String>> _getHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(tokenKey);
    await prefs.remove(userKey);
    await prefs.remove(refreshTokenKey);
    // Keep remember me preference for next login
  }

  Future<bool> isLoggedIn() async {
    final token = await getToken();
    if (token == null) return false;

    // Check if token is expired
    if (await isTokenExpired()) {
      // Try to refresh token if remember me is enabled
      final rememberMe = await shouldRememberMe();
      if (rememberMe) {
        final refreshResult = await refreshToken();
        return refreshResult?['success'] == true;
      }
      return false;
    }

    return true;
  }
}
