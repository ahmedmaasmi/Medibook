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
  String _transcript = '';
  String? _response;
  bool? _responseSuccess;

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
        if (status == 'done') setState(() => _isListening = false);
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
      _transcript = '';
      _response = null;
    });

    await _speech.listen(
      onResult: (result) {
        setState(() {
          _transcript = result.recognizedWords;
        });
      },
      listenFor: const Duration(seconds: 30),
      pauseFor: const Duration(seconds: 3),
    );
  }

  void _stopListening() async {
    await _speech.stop();
    setState(() => _isListening = false);
  }

  Future<void> _processCommand() async {
    if (_transcript.isEmpty) return;
    
    setState(() => _isProcessing = true);

    try {
      final result = await ApiService.processVoiceCommand(_transcript);
      setState(() {
        _response = result['message'];
        _responseSuccess = result['success'];
      });
      
      // Speak the response
      await _tts.speak(result['message']);
    } catch (e) {
      setState(() {
        _response = e.toString().replaceAll('Exception: ', '');
        _responseSuccess = false;
      });
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  @override
  void dispose() {
    _speech.stop();
    _tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1E1B4B), Color(0xFF581C87), Color(0xFF0F172A)],
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              // Header
              const Text(
                'AI Voice Booking',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 8),
              Text(
                'Speak naturally to book appointments',
                style: TextStyle(color: Colors.white.withOpacity(0.6)),
              ),
              
              const Spacer(),

              // Microphone Button
              GestureDetector(
                onTap: _isProcessing ? null : (_isListening ? _stopListening : _startListening),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _isListening ? const Color(0xFF6366F1) : Colors.white.withOpacity(0.1),
                    boxShadow: _isListening
                        ? [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.5), blurRadius: 30, spreadRadius: 10)]
                        : null,
                  ),
                  child: Icon(
                    _isListening ? Icons.mic : Icons.mic_none,
                    size: 48,
                    color: _isListening ? Colors.white : Colors.white.withOpacity(0.7),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              Text(
                _isListening ? 'Listening...' : (_isProcessing ? 'Processing...' : 'Tap to speak'),
                style: TextStyle(color: Colors.white.withOpacity(0.6)),
              ),

              const SizedBox(height: 32),

              // Transcript
              if (_transcript.isNotEmpty) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('You said:', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                      const SizedBox(height: 8),
                      Text('"$_transcript"', style: const TextStyle(color: Colors.white, fontSize: 16)),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                if (!_isListening && _response == null)
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isProcessing ? null : _processCommand,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6366F1),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _isProcessing
                          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)))
                          : const Text('Process Request', style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ),
              ],

              // Response
              if (_response != null) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: (_responseSuccess == true ? const Color(0xFF22C55E) : const Color(0xFFEAB308)).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: (_responseSuccess == true ? const Color(0xFF22C55E) : const Color(0xFFEAB308)).withOpacity(0.5)),
                  ),
                  child: Text(_response!, style: TextStyle(color: _responseSuccess == true ? const Color(0xFF22C55E) : const Color(0xFFEAB308))),
                ),
              ],

              const Spacer(),

              // Example Commands
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Try saying:', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    ...[
                      '"Book an appointment with Dr. Smith tomorrow"',
                      '"Check availability for Monday"',
                      '"What are my upcoming appointments?"',
                    ].map((example) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          Container(width: 6, height: 6, decoration: const BoxDecoration(color: Color(0xFF6366F1), shape: BoxShape.circle)),
                          const SizedBox(width: 12),
                          Expanded(child: Text(example, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 12))),
                        ],
                      ),
                    )),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
