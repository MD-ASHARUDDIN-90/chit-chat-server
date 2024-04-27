export const getEmailTemplate = (username, otp) => {
  const subject = `Welcome to ChitChat ${username}!`;
  const text = `Welcome to ChitChat ${username}! Your OTP is ${otp}`;
  const html = `<body style="font-family: Arial, sans-serif; background-color: #f0f0f0; margin: 0; padding: 0;">
     <div class="container" style="max-width: 600px; margin: 20px auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
         <div class="header" style="background-color: #007bff; color: #fff; padding: 10px; text-align: center; border-radius: 8px 8px 0 0;">
             <h1>🌟 Welcome to ChitChat! 🌟</h1>
             <h2>Your Journey Begins: Email Verification</h2>
         </div>
         <div class="content" style="padding: 20px;">
             <p>Hello ${username}!</p>
             <div class="otp-box" style="background-color: lightgray; padding: 2rem;">
                 <span>Your Magical OTP: ${otp}</span>
             </div>
             <p>Thank you for stepping into the ChitChat universe! 🚀 We're thrilled to have you aboard.</p>
             <p>If you ever need assistance or want to share your cosmic thoughts, our support team is just a starlight away.</p>
             <p>Stay connected, explore the constellations of conversation, and enjoy your interstellar ChitChat experience! 🌠</p>
         </div>
     </div>
 </body>`;
  return { subject, text, html };
};
