const path = require('path');
const ejs = require('ejs');
const User = require('./user');

const forgotPassword = (req, res) => {
  res.render('forgot-password');
};



const resetPassword = async (req, res) => {
  const { email } = req.body;
  const resetToken = Math.random().toString(36).substr(2, 10);

  // Save the reset token and email to your database
  try {
    const user = await User.findUserByEmail(email);

    if (!user) {
      return res.status(400).send('User not found');
    }

    const tokenExpires = new Date(Date.now() + 3600000); // Token expires in 1 hour
    const changes = {
      passwordResetToken: resetToken,
      passwordResetExpires: tokenExpires,
    };
    await User.updateUser(email, changes);

  } catch (error) {
    console.error(error);
    return res.status(500).send('Error saving password reset token');
  }

  try {
    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

    const emailHtml = await new Promise((resolve, reject) => {
      ejs.renderFile(path.join(__dirname, '/views/password-reset-email.ejs'), { resetLink }, (err, html) => {
        if (err) {
          reject(err);
        } else {
          resolve(html);
        }
      });
    });

    const emailjs = await import('emailjs');

    const server = emailjs.default.server.connect({
      user: process.env.EMAILJS_USER,
      password: process.env.EMAILJS_PASSWORD,
      host: process.env.EMAILJS_HOST,
      ssl: true,
    });
    
    server.send(
      {
        text: '', // Empty text, since we are sending HTML
        from: process.env.EMAILJS_FROM, // Sender email address
        to: email,
        subject: 'Password Reset',
        attachment: [
          {
            data: emailHtml,
            alternative: true,
          },
        ],
      },
      (err, message) => {
        if (err) {
          console.log(err);
          res.status(500).send('Error sending password reset email');
        } else {
          console.log('Password reset email sent successfully');
          res.send('Password reset email sent successfully');
        }
      }
    );
      
  } catch (error) {
    console.error(error);
    res.status(500).send('Error sending password reset email');
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
};
