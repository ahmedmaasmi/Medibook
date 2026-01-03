import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:flutter_tts/flutter_tts.dart';
import '../../services/api_service.dart';

class VoiceBookingScreen extends StatefulWidget {
  const VoiceBookingScreen({super.key});

  @override
  State<VoiceBookingScreen> createState() => _VoiceBookingScreenState();
}

class _VoiceBookingScreenState extends State<VoiceBookingScreen> {
  final SpeechToText _speech = SpeechToText();
  final FlutterTts _tts = FlutterTts();
  
  bool _isListening = false;
  bool _isProcessing = false;
  bool _speechAvailable = false;
  final List<Map<String, dynamic>> _messages = [
    {
      'isUser': false,
      'text': 'Hi! I\'m here to help you book a doctor\'s appointment. You can say things like "Book an appointment with a cardiologist for tomorrow" or "Find me a dentist available next week". What would you like to do?',
    }
  ];

  @override
  void initState() {
    super.initState();
    _initSpeech();
    _initTts();
  }

  Future<void> _initSpeech() async {
    _speechAvailable = await _speech.initialize(
      onError: (error) => setState(() => _isListening = false),
      onStatus: (status) {
        if (status == 'done') {
           setState(() => _isListening = false);
           if (_speech.lastRecognizedWords.isNotEmpty) {
             _handleUserMessage(_speech.lastRecognizedWords);
           }
        }
      },
    );
    setState(() {});
  }

  Future<void> _initTts() async {
    await _tts.setLanguage('en-US');
    await _tts.setSpeechRate(0.5);
    await _tts.setVolume(1.0);
  }

  void _startListening() async {
    if (!_speechAvailable) return;
    
    setState(() {
      _isListening = true;
    });

    await _speech.listen(
      onResult: (result) {
        // Real-time updates could go here if we wanted to show partial results
      },
      listenFor: const Duration(seconds: 30),
      pauseFor: const Duration(seconds: 2),
    );
  }

  void _stopListening() async {
    await _speech.stop();
    setState(() => _isListening = false);
  }

  Future<void> _handleUserMessage(String text) async {
    if (text.isEmpty) return;

    setState(() {
      _messages.add({
        'isUser': true,
        'text': text,
      });
      _isProcessing = true;
    });

    try {
      // Process voice command for appointment booking
      final result = await ApiService.processVoiceCommand(text);
      final responseText = result['message'];

      setState(() {
        _messages.add({
          'isUser': false,
          'text': responseText,
        });
      });

      await _tts.speak(responseText);
    } catch (e) {
      setState(() {
        _messages.add({
          'isUser': false,
          'text': "I'm sorry, I couldn't process that request. Please try again or use the manual booking option.",
        });
      });
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  void _showHelpDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text(
          'Voice Booking Help',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'You can say things like:',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            _buildExampleText('"Book an appointment with a cardiologist"'),
            _buildExampleText('"Find me a dentist for next Tuesday"'),
            _buildExampleText('"Schedule a check-up with Dr. Smith"'),
            _buildExampleText('"I need to see a pediatrician tomorrow"'),
            const SizedBox(height: 16),
            Text(
              'The system will help you find available doctors and book appointments using natural language.',
              style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 14),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }

  Widget _buildExampleText(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: TextStyle(
          color: Colors.white.withOpacity(0.8),
          fontStyle: FontStyle.italic,
        ),
      ),
    );
  }

  @override
  void dispose() {
    _speech.stop();
    _tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF090607),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          children: [
            const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.mic, color: Color(0xFFAC1ED6), size: 16),
                SizedBox(width: 8),
                Text('Voice Booking', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ],
            ),
            Text(
              'Speak to book appointments',
              style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.5)),
            ),
          ],
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.help_outline),
            onPressed: () => _showHelpDialog(context),
          ),
        ],
      ),
      body: Stack(
        children: [
           // Abstract background orb
          if (_messages.isEmpty || _messages.length < 3)
            Positioned(
              top: MediaQuery.of(context).size.height * 0.2,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  width: 300,
                  height: 300,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        const Color(0xFFAC1ED6).withOpacity(0.2),
                        Colors.transparent,
                      ],
                    ),
                    boxShadow: [
                       BoxShadow(
                        color: const Color(0xFFAC1ED6).withOpacity(0.1),
                        blurRadius: 100,
                        spreadRadius: 20,
                      )
                    ]
                  ),
                ),
              ),
            ),

          Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _messages.length,
                  itemBuilder: (context, index) {
                    final msg = _messages[index];
                    final isUser = msg['isUser'] as bool;
                    return Align(
                      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 24),
                        padding: const EdgeInsets.all(20),
                        constraints: BoxConstraints(
                          maxWidth: MediaQuery.of(context).size.width * 0.8,
                        ),
                        decoration: BoxDecoration(
                          gradient: isUser
                              ? const LinearGradient(
                                  colors: [Color(0xFFAC1ED6), Color(0xFFC26E73)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                )
                              : null,
                          color: isUser ? null : const Color(0xFF221F20),
                          borderRadius: BorderRadius.only(
                            topLeft: const Radius.circular(24),
                            topRight: const Radius.circular(24),
                            bottomLeft: Radius.circular(isUser ? 24 : 4),
                            bottomRight: Radius.circular(isUser ? 4 : 24),
                          ),
                        ),
                        child: Text(
                          msg['text'],
                          style: TextStyle(
                            color: Colors.white.withOpacity(isUser ? 1.0 : 0.8),
                            height: 1.5,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              
              // Bottom Input Area
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
                child: Column(
                  children: [
                    // Status Text
                    Text(
                      _isListening
                          ? 'Listening... Say your appointment request'
                          : _isProcessing
                              ? 'Processing your request...'
                              : 'Tap the microphone to start booking',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.7),
                        fontSize: 14,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),

                    // Voice Button
                    GestureDetector(
                      onTap: _isListening ? _stopListening : _startListening,
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: _isListening
                                ? [const Color(0xFFEF4444), const Color(0xFFDC2626)]
                                : [const Color(0xFFAC1ED6), const Color(0xFFC26E73)],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: (_isListening ? const Color(0xFFEF4444) : const Color(0xFFAC1ED6)).withOpacity(0.5),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Icon(
                          _isListening
                              ? Icons.stop
                              : (_isProcessing ? Icons.hourglass_empty : Icons.mic),
                          color: Colors.white,
                          size: 36,
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Alternative Option
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.calendar_today,
                            color: Colors.white.withOpacity(0.5),
                            size: 16,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Or use manual booking',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.5),
                              fontSize: 14,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
