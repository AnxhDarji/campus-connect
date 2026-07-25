const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const SENDER = {
  name: "CampusConnect",
  email: "campusconnect.charusat@gmail.com",
};

export const sendOTPEmail = async ({ toEmail, toName, otp }) => {
  const body = {
    sender: SENDER,
    to: [{ email: toEmail, name: toName }],
    subject: "Your CampusConnect Verification Code",
    textContent: `Hello ${toName},

Welcome to CampusConnect!

Your One-Time Password (OTP) for account verification is:

${otp}

This OTP is valid for 5 minutes.

Do not share this OTP with anyone.

Regards,
CampusConnect Team`,
  };

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send OTP email.");
  }

  return true;
};
