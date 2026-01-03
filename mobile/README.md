# MediBook Mobile App

A Flutter mobile application for healthcare appointment booking with voice assistance capabilities.

## Features

- **Patient Dashboard**: View upcoming appointments and quick access to booking features
- **Voice Booking**: Natural language appointment booking using speech-to-text
- **Doctor Discovery**: Browse and select healthcare providers by specialty
- **Appointment Management**: View, reschedule, and cancel appointments
- **Secure Authentication**: JWT-based authentication with biometric support
- **Offline Capabilities**: Cached appointment data for offline access

## Architecture

The app follows Flutter best practices with:

- **Provider** for state management
- **Clean Architecture** with separated concerns
- **Repository Pattern** for data management
- **Secure Storage** for sensitive data
- **Voice Integration** with speech-to-text and text-to-speech

## Getting Started

### Prerequisites

- Flutter SDK (>=3.0.0)
- Android Studio or VS Code
- Android/iOS device or emulator

### Installation

1. Clone the repository
2. Navigate to the mobile directory: `cd mobile`
3. Install dependencies: `flutter pub get`
4. Configure API endpoint in `lib/config/app_config.dart`
5. Run the app: `flutter run`

### Configuration

Update the API endpoint in `lib/config/app_config.dart`:

```dart
static const String apiUrl = 'http://your-api-endpoint:3001/api';
```

## Healthcare Compliance

This application is designed with healthcare privacy and security in mind:

- HIPAA-compliant data handling
- Secure token storage
- Encrypted communication
- Audit logging capabilities
- Patient data protection

## Development

### Code Style

Follow Dart and Flutter best practices:

- Use `flutter analyze` for static analysis
- Format code with `dart format`
- Write comprehensive unit and integration tests

### Testing

Run tests with:
```bash
flutter test
```

### Building

Build for production:
```bash
flutter build apk --release  # Android
flutter build ios --release  # iOS
```

## Contributing

1. Follow the established code style
2. Write tests for new features
3. Ensure healthcare compliance for data handling
4. Update documentation as needed

## License

This project is part of the MediBook healthcare platform.
