import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'config/app_config.dart';
import 'providers/auth_provider.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/client/client_dashboard.dart';
import 'screens/doctor/doctor_dashboard.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: MaterialApp(
        title: 'MediBook - ${AppConfig.tagline}',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(AppConfig.primaryColor),
            brightness: Brightness.dark,
            background: const Color(AppConfig.backgroundColor),
            surface: const Color(AppConfig.surfaceColor),
            primary: const Color(AppConfig.primaryColor),
            secondary: const Color(AppConfig.secondaryColor),
            error: const Color(AppConfig.errorColor),
          ),
          textTheme: GoogleFonts.epilogueTextTheme(
            ThemeData.dark().textTheme,
          ),
          scaffoldBackgroundColor: const Color(AppConfig.backgroundColor),
          appBarTheme: const AppBarTheme(
            backgroundColor: Colors.transparent,
            elevation: 0,
            foregroundColor: Colors.white,
          ),
          cardTheme: CardThemeData(
            color: const Color(AppConfig.surfaceColor),
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppConfig.defaultBorderRadius),
            ),
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(AppConfig.primaryColor),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppConfig.defaultBorderRadius),
              ),
              padding: const EdgeInsets.symmetric(
                horizontal: AppConfig.defaultPadding,
                vertical: 12,
              ),
            ),
          ),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: Colors.white.withOpacity(0.05),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppConfig.defaultBorderRadius),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppConfig.defaultBorderRadius),
              borderSide: const BorderSide(color: Color(AppConfig.primaryColor)),
            ),
          ),
        ),
        initialRoute: '/',
        routes: {
          '/': (context) => const SplashScreen(),
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/client': (context) => const ClientDashboard(),
          '/doctor': (context) => const DoctorDashboard(),
        },
      ),
    );
  }
}
