import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Twilio Client Setup
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  const twilioWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER;

  const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

  // API Routes
  app.post('/api/send-receipt', async (req, res) => {
    const { booking, userPhone } = req.body;

    if (!booking || !userPhone) {
      return res.status(400).json({ error: 'Missing booking details or phone number' });
    }

    if (!client) {
      console.warn('Twilio credentials not configured. Skipping notification.');
      return res.json({ success: true, message: 'Twilio not configured, but booking stored.' });
    }

    try {
      // 1. Send SMS
      const smsMessage = `Your slot is booked at ${booking.marketName} on ${booking.date}, ${booking.timeSlot}. Booking ID: ${booking.id?.slice(-8).toUpperCase()} - AgriEasy`;
      
      await client.messages.create({
        body: smsMessage,
        from: twilioPhone,
        to: userPhone
      });

      // 2. Send WhatsApp
      const waMessage = `*AgriEasy Slot Booking Receipt*\n\n` +
        `✅ *Booking ID:* ${booking.id?.slice(-8).toUpperCase()}\n` +
        `🏪 *Market:* ${booking.marketName}\n` +
        `📍 *Location:* ${booking.district}, ${booking.state}\n` +
        `📅 *Date:* ${booking.date}\n` +
        `⏰ *Slot:* ${booking.timeSlot}\n` +
        `🌾 *Produce:* ${booking.cropName}\n` +
        `⚖️ *Quantity:* ${booking.quantity} Qtl\n\n` +
        `*Instructions:*\n` +
        `• Carry original Aadhaar Card.\n` +
        `• Arrive 30 mins before your slot.\n` +
        `• Follow safety measures.\n\n` +
        `Download AgriEasy app for more info!`;

      await client.messages.create({
        body: waMessage,
        from: `whatsapp:${twilioWhatsApp}`,
        to: `whatsapp:${userPhone}`
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error sending notifications:', error);
      res.status(500).json({ error: 'Failed to send notifications' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
