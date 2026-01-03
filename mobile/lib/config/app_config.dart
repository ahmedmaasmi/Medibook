class AppConfig {
  // API Configuration
  static const String apiUrl = 'http://10.0.2.2:3001/api'; // Android emulator localhost
  // For iOS simulator, use: 'http://localhost:3001/api'
  // For physical device, use your machine's IP: 'http://192.168.x.x:3001/api'

  // App Information
  static const String appName = 'MediBook';
  static const String version = '1.0.0';
  static const String tagline = 'Your Healthcare Companion';

  // Healthcare-specific settings
  static const int appointmentReminderHours = 24; // Remind 24 hours before
  static const int maxRetryAttempts = 3;
  static const Duration apiTimeout = Duration(seconds: 30);

  // Voice settings
  static const String voiceLanguage = 'en-US';
  static const double voicePitch = 1.0;
  static const double voiceRate = 0.8;

  // Privacy & Security
  static const bool enableBiometricAuth = true;
  static const Duration sessionTimeout = Duration(hours: 8);

  // UI Constants
  static const double defaultBorderRadius = 12.0;
  static const double defaultPadding = 16.0;

  // Colors (Healthcare theme)
  static const int primaryColor = 0xFFAC1ED6; // Purple
  static const int secondaryColor = 0xFFC26E73; // Pink
  static const int successColor = 0xFF22C55E; // Green
  static const int warningColor = 0xFFF59E0B; // Yellow
  static const int errorColor = 0xFFEF4444; // Red
  static const int backgroundColor = 0xFF090607; // Dark background
  static const int surfaceColor = 0xFF221F20; // Card surface
}
