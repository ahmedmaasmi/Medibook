import { google } from 'googleapis';
import config from '../config/index.js';
import { Doctor } from '../models/index.js';

const oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
);

// Generate OAuth2 URL for Google Calendar authorization
export const getAuthUrl = (doctorId) => {
    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: doctorId,
        prompt: 'consent',
    });

    return url;
};

// Exchange authorization code for tokens
export const handleCallback = async (code, doctorId) => {
    const { tokens } = await oauth2Client.getToken(code);

    // Save tokens to doctor record
    await Doctor.update(
        {
            googleCalendarToken: tokens,
            googleCalendarConnected: true,
        },
        { where: { id: doctorId } }
    );

    return tokens;
};

// Create calendar event for appointment
export const createCalendarEvent = async (tokens, appointment, doctor, client) => {
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startDateTime = `${appointment.appointmentDate}T${appointment.startTime}`;
    const endDateTime = `${appointment.appointmentDate}T${appointment.endTime}`;

    const event = {
        summary: `Appointment with ${client.firstName} ${client.lastName}`,
        description: appointment.reason || 'Medical appointment',
        start: {
            dateTime: startDateTime,
            timeZone: 'UTC',
        },
        end: {
            dateTime: endDateTime,
            timeZone: 'UTC',
        },
        attendees: [
            { email: client.email },
        ],
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 24 * 60 },
                { method: 'popup', minutes: 30 },
            ],
        },
    };

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            sendUpdates: 'all',
        });

        return response.data.id;
    } catch (error) {
        console.error('Failed to create calendar event:', error);

        // Refresh token if expired
        if (error.code === 401) {
            try {
                const { credentials } = await oauth2Client.refreshAccessToken();
                await Doctor.update(
                    { googleCalendarToken: credentials },
                    { where: { id: doctor.id } }
                );

                oauth2Client.setCredentials(credentials);
                const response = await calendar.events.insert({
                    calendarId: 'primary',
                    resource: event,
                    sendUpdates: 'all',
                });
                return response.data.id;
            } catch (refreshError) {
                console.error('Failed to refresh token:', refreshError);
            }
        }

        return null;
    }
};

// Delete calendar event
export const deleteCalendarEvent = async (tokens, eventId) => {
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        await calendar.events.delete({
            calendarId: 'primary',
            eventId,
            sendUpdates: 'all',
        });
        return true;
    } catch (error) {
        console.error('Failed to delete calendar event:', error);
        return false;
    }
};

// Get calendar events for sync
export const getCalendarEvents = async (tokens, timeMin, timeMax) => {
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
    });

    return response.data.items;
};

// Disconnect Google Calendar
export const disconnect = async (doctorId) => {
    await Doctor.update(
        {
            googleCalendarToken: null,
            googleCalendarConnected: false,
        },
        { where: { id: doctorId } }
    );

    return true;
};

export default {
    getAuthUrl,
    handleCallback,
    createCalendarEvent,
    deleteCalendarEvent,
    getCalendarEvents,
    disconnect,
};
