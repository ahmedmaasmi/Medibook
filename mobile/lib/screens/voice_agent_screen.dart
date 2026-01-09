import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import '../widgets/slime_ball.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import 'doctors_screen.dart';
import 'appointments_screen.dart';

class VoiceAgentScreen extends StatefulWidget {
  const VoiceAgentScreen({super.key});

  @override
  State<VoiceAgentScreen> createState() => _VoiceAgentScreenState();
}

class _VoiceAgentScreenState extends State<VoiceAgentScreen> {
  final ApiService _apiService = ApiService();
  final AuthService _authService = AuthService();
  final stt.SpeechToText _speech = stt.SpeechToText();
  
  String? _agentResponse;
  bool _isListening = false;
  bool _isProcessing = false;
  bool _speechAvailable = false;

  @override
  void initState() {
    super.initState();
    _initSpeech();
  }

  Future<void> _initSpeech() async {
    try {
      _speechAvailable = await _speech.initialize(
        onStatus: (status) {
          debugPrint('Speech Status: $status');
          if (status == 'notListening' && _isListening) {
             // Sometimes it stops automatically
             setState(() => _isListening = false);
          }
        },
        onError: (error) {
          debugPrint('Speech Error: $error');
          setState(() {
            _isListening = false;
            _agentResponse = "Sorry, I couldn't hear you clearly.";
          });
        },
      );
      setState(() {});
    } catch (e) {
      debugPrint('Speech init error: $e');
    }
  }

  void _handleVoiceInput() async {
    if (!_speechAvailable) {
      await _initSpeech();
      if (!_speechAvailable) {
        if (mounted) {
           ScaffoldMessenger.of(context).showSnackBar(
             const SnackBar(content: Text('Speech recognition not available')),
           );
        }
        return;
      }
    }

    if (_isListening) {
      _speech.stop();
      setState(() => _isListening = false);
    } else {
      setState(() {
        _isListening = true;
        _agentResponse = "Listening...";
      });
      
      _speech.listen(
        onResult: (result) {
          if (result.finalResult) {
            setState(() => _isListening = false);
            _processMessage(result.recognizedWords);
          }
        },
        listenFor: const Duration(seconds: 30),
        pauseFor: const Duration(seconds: 3),
        partialResults: false,
      );
    }
  }

  Future<void> _processMessage(String message) async {
    if (message.isEmpty) return;

    setState(() {
      _isProcessing = true;
      _agentResponse = null;
    });

    try {
      final response = await _apiService.sendChatMessage(message);
      setState(() {
        _agentResponse = response['response'] ?? response['message'] ?? 'I found something for you.';
      });
    } catch (e) {
      setState(() {
        _agentResponse = 'Sorry, I had trouble connecting. Please try again.';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      body: SafeArea(
        child: Stack(
          children: [
            // Logout / Profile Button (Top Right)
            Positioned(
              top: 16,
              right: 16,
              child: IconButton(
                onPressed: () async {
                  await _authService.logout();
                  if (mounted) {
                    Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
                  }
                },
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.logout, color: Colors.white70, size: 20),
                ),
              ),
            ),
            
            Column(
              children: [
                const Spacer(flex: 2),
                // Top Hint Text
                const Text(
                  'I can help you find a doctor',
                  style: TextStyle(
                    color: Colors.white54,
                    fontSize: 16,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 16),
                // Main Title
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 40),
                  child: Text(
                    'What Can I Do for\nYou Today?',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      height: 1.2,
                    ),
                  ),
                ),
                const Spacer(flex: 3),
                // Glowing Orb
                Center(
                  child: SlimeBall(
                    message: _isProcessing 
                      ? "Thinking..." 
                      : (_isListening ? "Listening..." : _agentResponse),
                  ),
                ),
                const Spacer(flex: 3),
                // Bottom Controls
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Doctors Button (Left)
                      _buildNavButton(
                        icon: Icons.medical_services_outlined,
                        label: 'Doctors',
                        onTap: () {
                           Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const DoctorsScreen()),
                          );
                        },
                      ),
                      
                      // Voice/Input Button (Center)
                      GestureDetector(
                        onTap: _handleVoiceInput,
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: _isListening 
                                ? Colors.redAccent.withOpacity(0.8) 
                                : Colors.white.withOpacity(0.2),
                              width: _isListening ? 2 : 1,
                            ),
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: _isListening ? [
                                Colors.redAccent.withOpacity(0.2),
                                Colors.red.withOpacity(0.1),
                              ] : [
                                Colors.white.withOpacity(0.1),
                                Colors.white.withOpacity(0.05),
                              ],
                            ),
                            boxShadow: _isListening ? [
                              BoxShadow(
                                color: Colors.redAccent.withOpacity(0.3),
                                blurRadius: 20,
                                spreadRadius: 5,
                              )
                            ] : [],
                          ),
                          child: Icon(
                            _isListening ? Icons.mic : Icons.graphic_eq,
                            color: _isListening ? Colors.redAccent : Colors.greenAccent,
                            size: 32,
                          ),
                        ),
                      ),

                      // Appointments Button (Right)
                      _buildNavButton(
                        icon: Icons.calendar_month_outlined,
                        label: 'Visits',
                        onTap: () {
                           Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const AppointmentsScreen()),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          onPressed: onTap,
          icon: Icon(icon, color: Colors.white70),
          style: IconButton.styleFrom(
            backgroundColor: Colors.white.withOpacity(0.1),
            padding: const EdgeInsets.all(16),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white54,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}
