import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  List<Appointment> _appointments = [];
  bool _isLoading = true;
  String _filter = 'upcoming';

  @override
  void initState() {
    super.initState();
    _loadAppointments();
  }

  Future<void> _loadAppointments() async {
    setState(() => _isLoading = true);
    try {
      final today = DateTime.now().toIso8601String().split('T')[0];
      final appointments = await ApiService.getAppointments(
        fromDate: _filter == 'upcoming' ? today : null,
      );
      setState(() {
        _appointments = appointments;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _cancelAppointment(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Cancel Appointment', style: TextStyle(color: Colors.white)),
        content: const Text('Are you sure you want to cancel this appointment?', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('No')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Yes', style: TextStyle(color: Colors.red))),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await ApiService.cancelAppointment(id);
        _loadAppointments();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to cancel: $e')));
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'confirmed': return const Color(0xFF22C55E);
      case 'pending': return const Color(0xFFEAB308);
      case 'cancelled': return const Color(0xFFEF4444);
      case 'completed': return const Color(0xFF6366F1);
      default: return Colors.grey;
    }
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
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('My Appointments', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 16),
                  
                  // Filter Tabs
                  Row(
                    children: ['upcoming', 'all'].map((filter) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(filter[0].toUpperCase() + filter.substring(1)),
                        selected: _filter == filter,
                        selectedColor: const Color(0xFF6366F1),
                        backgroundColor: Colors.white.withOpacity(0.1),
                        labelStyle: TextStyle(color: _filter == filter ? Colors.white : Colors.white70),
                        onSelected: (selected) {
                          setState(() => _filter = filter);
                          _loadAppointments();
                        },
                      ),
                    )).toList(),
                  ),
                ],
              ),
            ),

            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _appointments.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.calendar_today, size: 64, color: Colors.white.withOpacity(0.3)),
                              const SizedBox(height: 16),
                              Text('No appointments', style: TextStyle(color: Colors.white.withOpacity(0.5))),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _loadAppointments,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            itemCount: _appointments.length,
                            itemBuilder: (context, index) {
                              final apt = _appointments[index];
                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.05),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text('Dr. ${apt.doctor?.user.lastName ?? 'Unknown'}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: _getStatusColor(apt.status).withOpacity(0.2),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(apt.status, style: TextStyle(fontSize: 12, color: _getStatusColor(apt.status))),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(apt.doctor?.specialization ?? '', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        Icon(Icons.calendar_today, size: 16, color: Colors.white.withOpacity(0.5)),
                                        const SizedBox(width: 8),
                                        Text(
                                          DateFormat('EEEE, MMM d, y').format(DateTime.parse(apt.appointmentDate)),
                                          style: TextStyle(color: Colors.white.withOpacity(0.7)),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        Icon(Icons.access_time, size: 16, color: Colors.white.withOpacity(0.5)),
                                        const SizedBox(width: 8),
                                        Text('${apt.startTime.substring(0, 5)} - ${apt.endTime.substring(0, 5)}', style: TextStyle(color: Colors.white.withOpacity(0.7))),
                                      ],
                                    ),
                                    if (apt.status == 'confirmed') ...[
                                      const SizedBox(height: 12),
                                      Align(
                                        alignment: Alignment.centerRight,
                                        child: TextButton(
                                          onPressed: () => _cancelAppointment(apt.id),
                                          child: const Text('Cancel', style: TextStyle(color: Colors.red)),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              );
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
