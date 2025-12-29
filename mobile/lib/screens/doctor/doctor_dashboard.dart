import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/auth_provider.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';

class DoctorDashboard extends StatefulWidget {
  const DoctorDashboard({super.key});

  @override
  State<DoctorDashboard> createState() => _DoctorDashboardState();
}

class _DoctorDashboardState extends State<DoctorDashboard> {
  List<Appointment> _todayAppointments = [];
  List<Appointment> _upcomingAppointments = [];
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
      setState(() {
        _todayAppointments = appointments.where((a) => a.appointmentDate == today).toList();
        _upcomingAppointments = appointments;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'confirmed': return const Color(0xFF22C55E);
      case 'pending': return const Color(0xFFEAB308);
      case 'cancelled': return const Color(0xFFEF4444);
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;

    return Scaffold(
      body: Container(
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
                                Text('Welcome, Dr. ${user?.lastName ?? 'Doctor'}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                                const SizedBox(height: 4),
                                Text('Manage your appointments', style: TextStyle(color: Colors.white.withOpacity(0.6))),
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

                        // Stats
                        Row(
                          children: [
                            Expanded(
                              child: _StatCard(
                                icon: Icons.calendar_today,
                                label: 'Today',
                                value: _todayAppointments.length.toString(),
                                color: const Color(0xFF6366F1),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _StatCard(
                                icon: Icons.schedule,
                                label: 'Upcoming',
                                value: _upcomingAppointments.length.toString(),
                                color: const Color(0xFF22C55E),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 32),

                        // Today's Schedule
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text("Today's Schedule", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                            Text(DateFormat('EEEE, MMM d').format(DateTime.now()), style: TextStyle(color: Colors.white.withOpacity(0.5))),
                          ],
                        ),
                        const SizedBox(height: 16),

                        if (_todayAppointments.isEmpty)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              children: [
                                Icon(Icons.event_available, size: 48, color: Colors.white.withOpacity(0.3)),
                                const SizedBox(height: 12),
                                Text('No appointments today', style: TextStyle(color: Colors.white.withOpacity(0.5))),
                              ],
                            ),
                          )
                        else
                          ..._todayAppointments.map((apt) => Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF6366F1).withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(apt.startTime.substring(0, 5), style: const TextStyle(color: Color(0xFF6366F1), fontWeight: FontWeight.bold)),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('${apt.client?.firstName ?? 'Unknown'} ${apt.client?.lastName ?? ''}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                                      if (apt.reason != null) Text(apt.reason!, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: _getStatusColor(apt.status).withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(apt.status, style: TextStyle(fontSize: 10, color: _getStatusColor(apt.status))),
                                ),
                              ],
                            ),
                          )),

                        const SizedBox(height: 32),

                        // Upcoming Appointments
                        const Text('Upcoming Appointments', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                        const SizedBox(height: 16),

                        if (_upcomingAppointments.isEmpty)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text('No upcoming appointments', style: TextStyle(color: Colors.white.withOpacity(0.5)), textAlign: TextAlign.center),
                          )
                        else
                          ..._upcomingAppointments.take(5).map((apt) => Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(12),
                                    gradient: const LinearGradient(colors: [Color(0xFF22C55E), Color(0xFF6366F1)]),
                                  ),
                                  child: Center(child: Text(apt.client?.firstName.substring(0, 1) ?? 'P', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18))),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('${apt.client?.firstName ?? 'Unknown'} ${apt.client?.lastName ?? ''}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                                      Text(apt.client?.email ?? '', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(DateFormat('MMM d').format(DateTime.parse(apt.appointmentDate)), style: const TextStyle(color: Color(0xFF6366F1), fontWeight: FontWeight.w600)),
                                    Text(apt.startTime.substring(0, 5), style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                                  ],
                                ),
                              ],
                            ),
                          )),
                      ],
                    ),
                  ),
                ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
              Text(label, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }
}
