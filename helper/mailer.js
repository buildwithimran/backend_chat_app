const nodemailer = require("nodemailer");
require('dotenv').config();

async function sendEmailAfterSignup(_email) {
    try {
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            service: 'gmail',
            port: 587,
            // port: 465,
            // secure: true,
            auth: {
                user: process.env.MAILER_EMAIL,
                pass: process.env.MAILER_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            },
        });
        var obj = {
            from: process.env.MAILER_EMAIL,
            to: _email,
            subject: "Thanks For Signup",
            html: `
            <!DOCTYPE html>
                <html>

                <head>
                    <meta name="viewport" content="initial-scale=1, viewport-fit=cover" />
                    <meta charset="UTF-8">
                    <title>Welcome to ChatApp</title>
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                        }

                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #f9f9f9;
                            border-radius: 10px;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        }

                        .header {
                            background-color: #131417;
                            color: white;
                            padding: 20px 0;
                            text-align: center;
                        }

                        h1 {
                            color: white;
                            font-size: 32px;
                            margin-bottom: 10px;
                        }

                        .content {
                            padding: 20px;
                        }

                        p {
                            font-size: 18px;
                            line-height: 1.6;
                            color: #444;
                            margin-bottom: 20px;
                        }

                        .cta-button {
                            display: inline-block;
                            padding: 12px 30px;
                            background-color: #131417;
                            color: white;
                            text-decoration: none;
                            border-radius: 25px;
                            margin-top: 20px;
                            font-weight: bold;
                            transition: background-color 0.3s ease;
                        }

                        .cta-button:hover {
                            background-color: #131417;
                        }

                        .footer {
                            text-align: center;
                            padding: 20px 0;
                            color: white;
                        }

                        .footer p {
                            color: white;
                        }
                    </style>
                </head>

                <body>
                    <div class="container">
                         <div class="header">
                            <h1>Welcome to ChatApp</h1>
                        </div>
                        <div class="content">
                            <p>Dear User</p>
                            <p>Thank you for signing up with us. We are excited to have you on board!</p>
                            <p>Your account is now ready for use. Dive into our incredible features and explore a world of
                                possibilities.</p>
                            <p>If you have any questions or need assistance, please don't hesitate to reach out to our dedicated support
                                team.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; ChatApp | 2024</p>
                        </div>
                    </div>
                </body>

                </html>
            `,
        }
        const info = await transporter.sendMail(obj);
        return {
            status: 'success',
            data: info,
        };
    } catch (error) {
        return {
            status: 'failed',
            data: error,
        };
    }
}

async function sendEmailOfInvitation(teamName, userData, userPassword) {
    try {
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            service: 'gmail',
            port: 587,
            // secure: true,
            auth: {
                user: process.env.MAILER_EMAIL,
                pass: process.env.MAILER_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            },
        });
        var obj = {
            from: process.env.MAILER_EMAIL,
            to: userData['email'],
            subject: "Invitation Received",
            html: `
                <!DOCTYPE html>
                <html>

                <head>
                    <meta name="viewport" content="initial-scale=1, viewport-fit=cover" />
                    <meta charset="UTF-8">
                    <title>Welcome to TeamPro App</title>
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                        }

                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #f9f9f9;
                            border-radius: 10px;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        }

                        .header {
                            background-color: #131417;
                            color: white;
                            padding: 20px 0;
                            text-align: center;
                        }

                        h1 {
                            color: white;
                            font-size: 32px;
                            margin-bottom: 10px;
                        }

                        .content {
                            padding: 20px;
                        }

                        p {
                            font-size: 18px;
                            line-height: 1.6;
                            color: #444;
                            margin-bottom: 20px;
                        }

                        .cta-button {
                            display: inline-block;
                            padding: 12px 30px;
                            background-color: #131417;
                            color: white;
                            text-decoration: none;
                            border-radius: 25px;
                            margin-top: 20px;
                            font-weight: bold;
                            transition: background-color 0.3s ease;
                        }

                        .cta-button:hover {
                            background-color: #131417;
                        }

                        .footer {
                            text-align: center;
                            padding: 20px 0;
                            background-color: #131417;
                            color: white;
                        }

                        .footer p {
                            color: white;
                        }
                    </style>
                </head>

                <body>
                    <div class="container">
                         <div class="header">
                            <h1>Welcome In ChatApp</h1>
                        </div>
                        <div class="content">
                            <p>Dear User,</p>
                            <p>We invite you to join our team, `+ teamName + `!</p>
                            <p>As a team member, you will have the following credentials:</p>
                            <ul>
                                <li><strong>Team Name:</strong> `+ teamName + `</li>
                                <li><strong>Assigned Role:</strong> `+ userData['role'] + `</li>
                                <li><strong>Email:</strong> `+ userData['email'] + `</li>
                                <li><strong>Phone:</strong> `+ userData['countryCode'] + userData['phone'] + `</li>
                            </ul>
                            <p>To activate your account and get started, please use the following credentials:</p>
                            <ul>
                                <li><strong>Phone:</strong> `+ userData['countryCode'] + userData['phone'] + ` </li>
                                <li><strong>Password:</strong> `+ userPassword + `</li>
                            </ul>
                            <p>Once you've logged in, your account will be ready for use. Dive into our incredible features and explore a world of possibilities.</p>
                            <p>If you have any questions or need assistance, please don't hesitate to reach out to our dedicated support team.</p>
                        </div>

                        <div class="footer">
                            <p>&copy; ChatApp | 2024</p>
                        </div>
                    </div>
                </body>

                </html>
                `,
        }
        const info = await transporter.sendMail(obj);
        return {
            status: 'success',
            data: info,
        }
    } catch (error) {
        return {
            status: 'failed',
            data: error,
        };
    }
}

async function sendOtpEmail(email, otp) {
    try {
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            service: 'gmail',
            port: 587,
            // secure: true,
            auth: {
                user: process.env.MAILER_EMAIL,
                pass: process.env.MAILER_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            },
        });
        var obj = {
            from: process.env.MAILER_EMAIL,
            to: email,
            subject: "Verification Code",
            html: `
            <!DOCTYPE html>
            <html>
            
            <head>
                    <meta name="viewport" content="initial-scale=1, viewport-fit=cover" />
                <title>OTP Email</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                    }
            
                    h1 {
                        color: #333;
                    }
            
                    p {
                        font-size: 16px;
                        line-height: 1.3;
                        color: #555;
                    }
            
                    .otp-box {
                        background-color: #131417;
                        color: #fff;
                        padding: 10px;
                        font-size: 24px;
                        border-radius: 5px;
                        margin-top: 10px;
                        width: 250px;
                        text-align: center;
                    }
                </style>
            </head>
            
            <body>
                <p>Dear User,</p>
                <p>Your One-Time Password (OTP) for accessing our services is:</p>
                <div class="otp-box">`+ otp + `</div>
                <p>Please use this OTP to complete your login or transaction.</p>
                <p>If you did not request this OTP, please disregard this email.</p>
                <p>Regards,</p>
                <p>Team ChatApp</p>
            </body>
            
            </html>
            `,
        }
        const info = await transporter.sendMail(obj);
        return {
            status: 'success',
            data: info,
        }
    } catch (error) {
        return {
            status: 'failed',
            data: error,
        };
    }
}

module.exports = { sendEmailAfterSignup, sendEmailOfInvitation, sendOtpEmail };