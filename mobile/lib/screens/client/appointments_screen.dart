import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';

class AppointmentsScreen extends StatefulWidget {
  final String initialFilter;

  const AppointmentsScreen({super.key, this.initialFilter = 'upcoming'});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  List<Appointment> _appointments = [];
  bool _isLoading = true;
  late String _filter;

  @override
  void initState() {
    super.initState();
    _filter = widget.initialFilter;
    _loadAppointments();
  }

  Future<void> _loadAppointments() async {
    setState(() => _isLoading = true);
    try {
      final today = DateTime.now().toIso8601String().split('T')[0];

      List<Appointment> appointments;
      switch (_filter) {
        case 'upcoming':
          appointments = await ApiService.getAppointments(fromDate: today);
          break;
        case 'past':
          appointments = await ApiService.getAppointments(toDate: today);
          break;
        case 'all':
        default:
          appointments = await ApiService.getAppointments();
          break;
      }

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
        content: const Text('Are you sure you want to cancel this appointment? This action cannot be undone.', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Keep Appointment')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Cancel Appointment', style: TextStyle(color: Color(0xFFEF4444))),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await ApiService.cancelAppointment(id);
        _loadAppointments();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Appointment cancelled successfully'),
            backgroundColor: Color(0xFF22C55E),
          ),
        );
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to cancel: $e')),
        );
      }
    }
  }

  void _rescheduleAppointment(Appointment apt) {
    // Navigate back to booking screen with pre-selected doctor
    Navigator.pop(context); // Go back to dashboard
    // This would ideally pass the doctor info to the booking screen
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Navigate to booking screen to reschedule')),
    );
  }

  void _bookFollowUp(Appointment apt) {
    // Navigate to booking screen with the same doctor
    Navigator.pop(context); // Go back to dashboard
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Navigate to booking screen to schedule follow-up')),
    );
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
                    children: ['upcoming', 'past', 'all'].map((filter) => Padding(
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
                                    // Header with doctor info and status
                                    Row(
                                      children: [
                                        Container(
                                          width: 40,
                                          height: 40,
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
                                                fontSize: 12,
                                              ),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'Dr. ${apt.doctor?.user.lastName ?? 'Unknown'}',
                                                style: const TextStyle(
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w600,
                                                  color: Colors.white,
                                                ),
                                              ),
                                              Text(
                                                apt.doctor?.specialization ?? 'General Practice',
                                                style: TextStyle(
                                                  color: Colors.white.withOpacity(0.6),
                                                  fontSize: 14,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
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
                                              fontSize: 10,
                                              color: _getStatusColor(apt.status),
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),

                                    const SizedBox(height: 16),

                                    // Appointment details
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withOpacity(0.05),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Column(
                                        children: [
                                          Row(
                                            children: [
                                              Icon(
                                                Icons.calendar_today,
                                                size: 18,
                                                color: const Color(0xFFAC1ED6),
                                              ),
                                              const SizedBox(width: 8),
                                              Text(
                                                DateFormat('EEEE, MMMM d, yyyy').format(DateTime.parse(apt.appointmentDate)),
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 8),
                                          Row(
                                            children: [
                                              Icon(
                                                Icons.schedule,
                                                size: 18,
                                                color: const Color(0xFFAC1ED6),
                                              ),
                                              const SizedBox(width: 8),
                                              Text(
                                                '${apt.startTime.substring(0, 5)} - ${apt.endTime.substring(0, 5)}',
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                            ],
                                          ),
                                          if (apt.reason != null && apt.reason!.isNotEmpty) ...[
                                            const SizedBox(height: 8),
                                            Row(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Icon(
                                                  Icons.description,
                                                  size: 18,
                                                  color: const Color(0xFFAC1ED6),
                                                ),
                                                const SizedBox(width: 8),
                                                Expanded(
                                                  child: Text(
                                                    apt.reason!,
                                                    style: TextStyle(
                                                      color: Colors.white.withOpacity(0.8),
                                                      fontSize: 14,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                          const SizedBox(height: 8),
                                          Row(
                                            children: [
                                              Icon(
                                                apt.bookedVia == 'mobile' ? Icons.phone_android : Icons.web,
                                                size: 18,
                                                color: Colors.white.withOpacity(0.5),
                                              ),
                                              const SizedBox(width: 8),
                                              Text(
                                                'Booked via ${apt.bookedVia}',
                                                style: TextStyle(
                                                  color: Colors.white.withOpacity(0.5),
                                                  fontSize: 12,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),

                                    // Action buttons
                                    if (apt.status == 'confirmed') ...[
                                      const SizedBox(height: 16),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.end,
                                        children: [
                                          TextButton.icon(
                                            onPressed: () => _rescheduleAppointment(apt),
                                            icon: Icon(Icons.edit_calendar, size: 16, color: const Color(0xFFF59E0B)),
                                            label: const Text(
                                              'Reschedule',
                                              style: TextStyle(color: Color(0xFFF59E0B)),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          TextButton.icon(
                                            onPressed: () => _cancelAppointment(apt.id),
                                            icon: Icon(Icons.cancel, size: 16, color: const Color(0xFFEF4444)),
                                            label: const Text(
                                              'Cancel',
                                              style: TextStyle(color: Color(0xFFEF4444)),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ] else if (apt.status == 'completed') ...[
                                      const SizedBox(height: 16),
                                      Align(
                                        alignment: Alignment.centerRight,
                                        child: TextButton.icon(
                                          onPressed: () => _bookFollowUp(apt),
                                          icon: Icon(Icons.refresh, size: 16, color: const Color(0xFF22C55E)),
                                          label: const Text(
                                            'Book Follow-up',
                                            style: TextStyle(color: Color(0xFF22C55E)),
                                          ),
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
