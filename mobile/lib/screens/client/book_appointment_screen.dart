import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';

class BookAppointmentScreen extends StatefulWidget {
  const BookAppointmentScreen({super.key});

  @override
  State<BookAppointmentScreen> createState() => _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends State<BookAppointmentScreen> {
  List<Doctor> _doctors = [];
  List<TimeSlot> _slots = [];
  Doctor? _selectedDoctor;
  DateTime _selectedDate = DateTime.now();
  TimeSlot? _selectedSlot;
  String _reason = '';
  
  bool _isLoading = true;
  bool _isLoadingSlots = false;
  bool _isBooking = false;

  @override
  void initState() {
    super.initState();
    _loadDoctors();
  }

  Future<void> _loadDoctors() async {
    try {
      final doctors = await ApiService.getDoctors();
      setState(() {
        _doctors = doctors;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadSlots() async {
    if (_selectedDoctor == null) return;
    
    setState(() => _isLoadingSlots = true);
    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
      final slots = await ApiService.getSlots(_selectedDoctor!.id, dateStr);
      setState(() {
        _slots = slots;
        _selectedSlot = null;
        _isLoadingSlots = false;
      });
    } catch (e) {
      setState(() => _isLoadingSlots = false);
    }
  }

  Future<void> _bookAppointment() async {
    if (_selectedDoctor == null || _selectedSlot == null) return;
    
    setState(() => _isBooking = true);
    try {
      await ApiService.bookAppointment({
        'doctorId': _selectedDoctor!.id,
        'appointmentDate': DateFormat('yyyy-MM-dd').format(_selectedDate),
        'startTime': _selectedSlot!.startTime,
        'endTime': _selectedSlot!.endTime,
        'reason': _reason,
        'bookedVia': 'mobile',
      });
      
      if (!mounted) return;
      
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          title: const Row(
            children: [
              Icon(Icons.check_circle, color: Color(0xFF22C55E)),
              SizedBox(width: 8),
              Text('Success', style: TextStyle(color: Colors.white)),
            ],
          ),
          content: Text(
            'Your appointment with Dr. ${_selectedDoctor!.user.lastName} has been booked for ${DateFormat('MMM d').format(_selectedDate)} at ${_selectedSlot!.startTime.substring(0, 5)}.',
            style: const TextStyle(color: Colors.white70),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                setState(() {
                  _selectedDoctor = null;
                  _selectedSlot = null;
                  _slots = [];
                  _reason = '';
                });
              },
              child: const Text('OK'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    } finally {
      setState(() => _isBooking = false);
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
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Book Appointment', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                    const SizedBox(height: 24),

                    // Select Doctor
                    const Text('Select Doctor', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    ..._doctors.map((doc) => GestureDetector(
                      onTap: () {
                        setState(() => _selectedDoctor = doc);
                        _loadSlots();
                      },
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _selectedDoctor == doc ? const Color(0xFF6366F1).withOpacity(0.2) : Colors.white.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: _selectedDoctor == doc ? const Color(0xFF6366F1) : Colors.transparent),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(10),
                                gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF9333EA)]),
                              ),
                              child: Center(child: Text(doc.user.initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Dr. ${doc.user.fullName}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                                  Text(doc.specialization, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                                ],
                              ),
                            ),
                            if (_selectedDoctor == doc) const Icon(Icons.check_circle, color: Color(0xFF6366F1)),
                          ],
                        ),
                      ),
                    )),
                    const SizedBox(height: 24),

                    // Select Date
                    if (_selectedDoctor != null) ...[
                      const Text('Select Date', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 80,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: 7,
                          itemBuilder: (context, index) {
                            final date = DateTime.now().add(Duration(days: index));
                            final isSelected = _selectedDate.day == date.day && _selectedDate.month == date.month;
                            return GestureDetector(
                              onTap: () {
                                setState(() => _selectedDate = date);
                                _loadSlots();
                              },
                              child: Container(
                                width: 60,
                                margin: const EdgeInsets.only(right: 8),
                                decoration: BoxDecoration(
                                  color: isSelected ? const Color(0xFF6366F1) : Colors.white.withOpacity(0.05),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(DateFormat('EEE').format(date), style: TextStyle(color: isSelected ? Colors.white : Colors.white70, fontSize: 12)),
                                    const SizedBox(height: 4),
                                    Text(DateFormat('d').format(date), style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Select Time
                      const Text('Select Time', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      _isLoadingSlots
                          ? const Center(child: CircularProgressIndicator())
                          : _slots.isEmpty
                              ? Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
                                  child: Text('No available slots', style: TextStyle(color: Colors.white.withOpacity(0.5))),
                                )
                              : Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: _slots.map((slot) => GestureDetector(
                                    onTap: () => setState(() => _selectedSlot = slot),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                      decoration: BoxDecoration(
                                        color: _selectedSlot == slot ? const Color(0xFF6366F1) : Colors.white.withOpacity(0.05),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(slot.startTime.substring(0, 5), style: const TextStyle(color: Colors.white)),
                                    ),
                                  )).toList(),
                                ),
                      const SizedBox(height: 24),

                      // Reason
                      const Text('Reason (Optional)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      TextField(
                        onChanged: (value) => _reason = value,
                        style: const TextStyle(color: Colors.white),
                        maxLines: 2,
                        decoration: InputDecoration(
                          hintText: 'Describe the reason for your visit...',
                          hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
                          filled: true,
                          fillColor: Colors.white.withOpacity(0.05),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Book Button
                      if (_selectedSlot != null)
                        SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: ElevatedButton(
                            onPressed: _isBooking ? null : _bookAppointment,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF6366F1),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: _isBooking
                                ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)))
                                : const Text('Confirm Booking', style: TextStyle(fontWeight: FontWeight.w600)),
                          ),
                        ),
                    ],
                  ],
                ),
              ),
      ),
    );
  }
}
