import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import 'voice_booking_screen.dart';
import 'appointments_screen.dart';
import 'book_appointment_screen.dart';

class ClientDashboard extends StatefulWidget {
  const ClientDashboard({super.key});

  @override
  State<ClientDashboard> createState() => _ClientDashboardState();
}

class _ClientDashboardState extends State<ClientDashboard> {
  int _currentIndex = 0;
  List<Appointment> _appointments = [];
  List<Doctor> _doctors = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final today = DateTime.now().toIso8601String().split('T')[0];
      final appointments = await ApiService.getAppointments(fromDate: today);
      final doctors = await ApiService.getDoctors();
      setState(() {
        _appointments = appointments.take(3).toList();
        _doctors = doctors.take(4).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _buildHome(),
          const BookAppointmentScreen(),
          const VoiceBookingScreen(),
          const AppointmentsScreen(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          border: Border(top: BorderSide(color: Colors.white.withOpacity(0.1))),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.transparent,
          selectedItemColor: const Color(0xFF6366F1),
          unselectedItemColor: Colors.white.withOpacity(0.5),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.calendar_today_outlined), activeIcon: Icon(Icons.calendar_today), label: 'Book'),
            BottomNavigationBarItem(icon: Icon(Icons.mic_outlined), activeIcon: Icon(Icons.mic), label: 'Voice'),
            BottomNavigationBarItem(icon: Icon(Icons.list_alt_outlined), activeIcon: Icon(Icons.list_alt), label: 'Appointments'),
          ],
        ),
      ),
    );
  }

  Widget _buildHome() {
    final user = Provider.of<AuthProvider>(context).user;
    
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1E1B4B), Color(0xFF581C87), Color(0xFF0F172A)],
        ),
      ),
      child: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _loadData,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Welcome back,', style: TextStyle(color: Colors.white.withOpacity(0.6))),
                              Text('${user?.firstName ?? 'User'} 👋', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                            ],
                          ),
                          IconButton(
                            onPressed: () async {
                              await Provider.of<AuthProvider>(context, listen: false).logout();
                              if (!mounted) return;
                              Navigator.pushReplacementNamed(context, '/login');
                            },
                            icon: Icon(Icons.logout, color: Colors.white.withOpacity(0.7)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Quick Actions
                      Row(
                        children: [
                          Expanded(
                            child: _ActionCard(
                              icon: Icons.calendar_today,
                              label: 'Book',
                              color: const Color(0xFF6366F1),
                              onTap: () => setState(() => _currentIndex = 1),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _ActionCard(
                              icon: Icons.mic,
                              label: 'Voice',
                              color: const Color(0xFF9333EA),
                              onTap: () => setState(() => _currentIndex = 2),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _ActionCard(
                              icon: Icons.list_alt,
                              label: 'Appointments',
                              color: const Color(0xFF22C55E),
                              onTap: () => setState(() => _currentIndex = 3),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),

                      // Upcoming Appointments
                      _SectionHeader(title: 'Upcoming Appointments', onSeeAll: () => setState(() => _currentIndex = 3)),
                      const SizedBox(height: 16),
                      if (_appointments.isEmpty)
                        _EmptyState(message: 'No upcoming appointments', onAction: () => setState(() => _currentIndex = 1))
                      else
                        ..._appointments.map((apt) => _AppointmentCard(appointment: apt)),
                      const SizedBox(height: 32),

                      // Available Doctors
                      _SectionHeader(title: 'Available Doctors', onSeeAll: () => setState(() => _currentIndex = 1)),
                      const SizedBox(height: 16),
                      ..._doctors.map((doc) => _DoctorCard(doctor: doc, onTap: () => setState(() => _currentIndex = 1))),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionCard({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.2),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback onSeeAll;

  const _SectionHeader({required this.title, required this.onSeeAll});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
        TextButton(onPressed: onSeeAll, child: const Text('See all', style: TextStyle(color: Color(0xFF6366F1)))),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String message;
  final VoidCallback onAction;

  const _EmptyState({required this.message, required this.onAction});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(16)),
      child: Column(
        children: [
          Icon(Icons.calendar_today, size: 48, color: Colors.white.withOpacity(0.3)),
          const SizedBox(height: 12),
          Text(message, style: TextStyle(color: Colors.white.withOpacity(0.5))),
          const SizedBox(height: 12),
          TextButton(onPressed: onAction, child: const Text('Book Now', style: TextStyle(color: Color(0xFF6366F1)))),
        ],
      ),
    );
  }
}

class _AppointmentCard extends StatelessWidget {
  final Appointment appointment;

  const _AppointmentCard({required this.appointment});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(16)),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF9333EA)]),
            ),
            child: Center(child: Text(appointment.doctor?.user.initials ?? 'D', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Dr. ${appointment.doctor?.user.lastName ?? 'Unknown'}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                Text(appointment.doctor?.specialization ?? '', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(appointment.appointmentDate, style: const TextStyle(color: Color(0xFF6366F1), fontWeight: FontWeight.w600)),
              Text(appointment.startTime.substring(0, 5), style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }
}

class _DoctorCard extends StatelessWidget {
  final Doctor doctor;
  final VoidCallback onTap;

  const _DoctorCard({required this.doctor, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(16)),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                gradient: const LinearGradient(colors: [Color(0xFF22C55E), Color(0xFF6366F1)]),
              ),
              child: Center(child: Text(doctor.user.initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Dr. ${doctor.user.fullName}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                  Text(doctor.specialization, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.white24),
          ],
        ),
      ),
    );
  }
}
