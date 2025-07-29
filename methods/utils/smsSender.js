// methods/utils/smsSender.js
// import axios from 'axios';

// export async function sendSMS({ to, message }) {
//   try {
//     const response = await axios.get('https://api.iletimerkezi.com/v1/send-sms', {
//       params: {
//         username: process.env.SMS_USER,
//         password: process.env.SMS_PASS,
//         msg: message,
//         gsm: to,
//         sender: 'VetCare', // Onaylı başlık olmalı
//       },
//     });
//     console.log(`SMS gönderildi: ${response.data} - Alıcı: ${to}`);
//     return response.data;
//   } catch (error) {
//     console.error(`SMS gönderme hatası (alıcı: ${to}):`, error.response?.data || error);
//     throw error;
//   }
// }
