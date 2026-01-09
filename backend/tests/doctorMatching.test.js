import { jest } from '@jest/globals';

// Define mocks before imports
jest.unstable_mockModule('../src/services/symptomAnalyzer.service.js', () => ({
    default: {
        analyzeSymptom: jest.fn()
    }
}));

jest.unstable_mockModule('../src/services/rag/doctorRag.service.js', () => ({
    default: {
        searchDoctorsByCase: jest.fn(),
        upsertDoctorEmbedding: jest.fn()
    }
}));

jest.unstable_mockModule('../src/services/appointment.service.js', () => ({
    default: {
        checkAvailability: jest.fn(),
        getAvailableSlots: jest.fn(),
        bookAppointment: jest.fn()
    }
}));

// Dynamic imports are needed when using unstable_mockModule
const { default: doctorMatchingService } = await import('../src/services/doctorMatching.service.js');
const { default: symptomAnalyzer } = await import('../src/services/symptomAnalyzer.service.js');
const { default: doctorRagService } = await import('../src/services/rag/doctorRag.service.js');
const { default: appointmentService } = await import('../src/services/appointment.service.js');

describe('Doctor Matching Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('recommendDoctor', () => {
        const mockAnalysis = {
            symptom: 'headache',
            specialty: 'Neurology',
            confidence: 0.8
        };

        const mockDoctor = {
            id: 'doc-123',
            specialization: 'Neurology',
            bio: 'Expert neurologist',
            consultationFee: 150,
            yearsOfExperience: 10,
            userId: 'user-123',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            distance: 0.1 // high similarity
        };

        it('should recommend a doctor based on symptoms', async () => {
            symptomAnalyzer.analyzeSymptom.mockResolvedValue(mockAnalysis);
            doctorRagService.searchDoctorsByCase.mockResolvedValue([mockDoctor]);
            
            const result = await doctorMatchingService.recommendDoctor({
                message: 'I have a headache',
                userId: 'client-1'
            });

            expect(symptomAnalyzer.analyzeSymptom).toHaveBeenCalledWith({
                message: 'I have a headache',
                userId: 'client-1'
            });
            expect(doctorRagService.searchDoctorsByCase).toHaveBeenCalled();
            expect(result.recommendedDoctor.id).toBe('doc-123');
            expect(result.recommendedDoctor.specialization).toBe('Neurology');
        });

        it('should check availability if date is provided', async () => {
            symptomAnalyzer.analyzeSymptom.mockResolvedValue(mockAnalysis);
            doctorRagService.searchDoctorsByCase.mockResolvedValue([mockDoctor]);
            appointmentService.checkAvailability.mockResolvedValue(true);
            appointmentService.getAvailableSlots.mockResolvedValue([{ startTime: '10:00:00' }]);

            const result = await doctorMatchingService.recommendDoctor({
                message: 'headache',
                userId: 'client-1',
                date: '2025-01-20',
                time: '10:00'
            });

            // Note: recommendDoctor calls checkAvailability if time is provided
            expect(appointmentService.checkAvailability).toHaveBeenCalled();
            expect(result.availability.isAvailable).toBe(true);
        });

        it('should throw error if no doctors found', async () => {
            symptomAnalyzer.analyzeSymptom.mockResolvedValue(mockAnalysis);
            doctorRagService.searchDoctorsByCase.mockResolvedValue([]);

            await expect(doctorMatchingService.recommendDoctor({
                message: 'unknown',
                userId: 'client-1'
            })).rejects.toThrow('No suitable doctors found');
        });
    });
});
