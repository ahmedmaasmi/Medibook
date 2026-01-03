import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import 'voice_booking_screen.dart';
import 'appointments_screen.dart';
import 'book_appointment_screen.dart';
import 'health_tracking_screen.dart';

class ClientDashboard extends StatefulWidget {
  const ClientDashboard({super.key});

  @override
  State<ClientDashboard> createState() => _ClientDashboardState();
}

class _ClientDashboardState extends State<ClientDashboard> {
  int _currentIndex = 0;
  List<Appointment> _appointments = [];
  bool _isLoading = true;
  String _appointmentFilter = 'upcoming';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final today = DateTime.now().toIso8601String().split('T')[0];
      final appointments = await ApiService.getAppointments(fromDate: today);
      if (mounted) {
        setState(() {
          _appointments = appointments.take(5).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _navigateToHealthTracking() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const HealthTrackingScreen()),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.white70),
      title: Text(
        title,
        style: const TextStyle(color: Colors.white, fontSize: 16),
      ),
      onTap: onTap,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
    );
  }

  Widget _buildActionCard({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white24),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: const Color(0xFFAC1ED6), size: 32),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                height: 1.2,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return const Color(0xFF22C55E); // Green
      case 'pending':
        return const Color(0xFFF59E0B); // Yellow
      case 'cancelled':
        return const Color(0xFFEF4444); // Red
      case 'completed':
        return const Color(0xFF6366F1); // Blue
      default:
        return const Color(0xFF6B7280); // Gray
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF090607),
        body: Center(child: CircularProgressIndicator(color: Color(0xFFAC1ED6))),
      );
    }

    return Builder(
      builder: (context) => Scaffold(
        backgroundColor: const Color(0xFF090607),
        drawer: Drawer(
          backgroundColor: const Color(0xFF1E1B4B),
          child: SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            colors: [Color(0xFFAC1ED6), Color(0xFFC26E73)],
                          ),
                        ),
                        child: const Center(
                          child: Text(
                            'MB',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Text(
                          'MediBook',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(color: Colors.white10),
                _buildDrawerItem(
                  icon: Icons.home_filled,
                  title: 'Home',
                  onTap: () {
                    Navigator.pop(context); // Close drawer
                    setState(() => _currentIndex = 0);
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.calendar_today,
                  title: 'Your Appointments',
                  onTap: () {
                    Navigator.pop(context); // Close drawer
                    setState(() {
                      _appointmentFilter = 'upcoming';
                      _currentIndex = 3;
                    });
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.health_and_safety,
                  title: 'Health Tracking',
                  onTap: () {
                    Navigator.pop(context); // Close drawer
                    _navigateToHealthTracking();
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.add_circle_outline,
                  title: 'Book Appointment',
                  onTap: () {
                    Navigator.pop(context); // Close drawer
                    setState(() => _currentIndex = 1);
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.history,
                  title: 'History',
                  onTap: () {
                    Navigator.pop(context); // Close drawer
                    setState(() {
                      _appointmentFilter = 'past';
                      _currentIndex = 3;
                    });
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.mic,
                  title: 'Voice Booking',
                  onTap: () {
                    Navigator.pop(context); // Close drawer
                    setState(() => _currentIndex = 2);
                  },
                ),
              ],
            ),
          ),
        ),
        body: IndexedStack(
          index: _currentIndex,
          children: [
            _buildHome(),
            BookAppointmentScreen(
              onViewAppointments: () => setState(() {
                _appointmentFilter = 'upcoming';
                _currentIndex = 3;
              }),
            ),
            const VoiceBookingScreen(),
            AppointmentsScreen(initialFilter: _appointmentFilter),
          ],
        ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: Colors.white10)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          type: BottomNavigationBarType.fixed,
          backgroundColor: const Color(0xFF090607),
          selectedItemColor: const Color(0xFFAC1ED6),
          unselectedItemColor: Colors.white.withOpacity(0.5),
          showSelectedLabels: false,
          showUnselectedLabels: false,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_filled), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.add_circle_outline), label: 'Book'),
            BottomNavigationBarItem(icon: Icon(Icons.mic), label: 'Voice'),
            BottomNavigationBarItem(icon: Icon(Icons.history), label: 'History'),
          ],
        ),
      ),
    ),
  );
}

  Widget _buildHome() {
    return Stack(
      children: [
        // Background Gradient Mesh
        Positioned(
          top: -100,
          left: -100,
          child: Container(
            width: 300,
            height: 300,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFAC1ED6).withOpacity(0.3),
            ),
          ),
        ),
        Positioned(
          top: 50,
          right: -50,
          child: Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFC26E73).withOpacity(0.2),
            ),
          ),
        ),
        
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Bar
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    GestureDetector(
                      onTap: () => Scaffold.of(context).openDrawer(),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.menu, color: Colors.white),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white24),
                      ),
                      child: const Text(
                        'MediBook',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 32),
                
                // Hero Text
                RichText(
                  text: const TextSpan(
                    style: TextStyle(
                      fontFamily: 'Epilogue',
                      fontSize: 40,
                      fontWeight: FontWeight.bold,
                      height: 1.1,
                      color: Colors.white,
                    ),
                    children: [
                      TextSpan(text: 'Book your\n'),
                      TextSpan(text: 'healthcare'),
                    ],
                  ),
                ),

                const SizedBox(height: 8),

                Text(
                  'Find and schedule appointments with top doctors',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 16,
                  ),
                ),

                const SizedBox(height: 32),

                // Action Cards Grid
                GridView.count(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    _buildActionCard(
                      icon: Icons.calendar_today,
                      title: 'Your\nAppointments',
                      onTap: () => setState(() {
                        _appointmentFilter = 'upcoming';
                        _currentIndex = 3;
                      }),
                    ),
                    _buildActionCard(
                      icon: Icons.health_and_safety,
                      title: 'Health\nTracking',
                      onTap: _navigateToHealthTracking,
                    ),
                    _buildActionCard(
                      icon: Icons.add_circle_outline,
                      title: 'Book\nAppointment',
                      onTap: () => setState(() => _currentIndex = 1), // Go to Book Appointment
                    ),
                    _buildActionCard(
                      icon: Icons.history,
                      title: 'History',
                      onTap: () => setState(() {
                        _appointmentFilter = 'past';
                        _currentIndex = 3;
                      }),
                    ),
                  ],
                ),
                
                const SizedBox(height: 32),
                
                // Upcoming Appointments Section
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Upcoming Appointments',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    GestureDetector(
                      onTap: () => setState(() => _currentIndex = 3), // Go to Appointments
                      child: Text(
                        'See all',
                        style: TextStyle(color: Colors.white.withOpacity(0.7)),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                Expanded(
                  child: _appointments.isEmpty
                      ? Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.calendar_today,
                              color: Colors.white.withOpacity(0.3),
                              size: 64,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No upcoming appointments',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.5),
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Book your first appointment to get started',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.3),
                                fontSize: 14,
                              ),
                            ),
                          ],
                        )
                      : ListView.builder(
                          itemCount: _appointments.length,
                          itemBuilder: (context, index) {
                            final apt = _appointments[index];
                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.white.withOpacity(0.1)),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 48,
                                    height: 48,
                                    decoration: const BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: LinearGradient(
                                        colors: [Color(0xFFAC1ED6), Color(0xFFC26E73)],
                                      ),
                                    ),
                                    child: Center(
                                      child: Text(
                                        apt.doctor?.user.initials ?? 'DR',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Dr. ${apt.doctor?.user.lastName ?? "Unknown"}',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                          ),
                                        ),
                                        Text(
                                          apt.doctor?.specialization ?? 'General Practice',
                                          style: TextStyle(
                                            color: Colors.white.withOpacity(0.6),
                                            fontSize: 14,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            Icon(
                                              Icons.calendar_today,
                                              size: 16,
                                              color: Colors.white.withOpacity(0.5),
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              '${apt.appointmentDate} at ${apt.startTime.substring(0, 5)}',
                                              style: TextStyle(
                                                color: Colors.white.withOpacity(0.7),
                                                fontSize: 14,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(apt.status).withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: _getStatusColor(apt.status).withOpacity(0.5),
                                      ),
                                    ),
                                    child: Text(
                                      apt.status.toUpperCase(),
                                      style: TextStyle(
                                        color: _getStatusColor(apt.status),
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
