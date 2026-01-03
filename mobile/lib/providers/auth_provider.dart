import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  String? _error;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  String? get error => _error;
  bool get isDoctor => _user?.role == 'doctor';
  bool get isClient => _user?.role == 'client';

  Future<void> checkAuth() async {
    _isLoading = true;
    // Defer notifyListeners to avoid calling during build
    Future.microtask(() => notifyListeners());

    try {
      final token = await ApiService.getToken();
      if (token != null) {
        _user = await ApiService.getProfile();
      }
    } catch (e) {
      await ApiService.clearToken();
      _user = null;
    } finally {
      _isLoading = false;
      // Defer notifyListeners to avoid calling during build
      Future.microtask(() => notifyListeners());
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await ApiService.login(email, password);
      _user = User.fromJson(data['user']);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(Map<String, dynamic> userData) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await ApiService.register(userData);
      _user = User.fromJson(data['user']);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await ApiService.clearToken();
    _user = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
