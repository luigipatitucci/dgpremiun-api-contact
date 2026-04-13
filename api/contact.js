const nodemailer = require("nodemailer")

const allowedOrigins = [
  "https://dgpremiumtransport.com",
  "https://www.dgpremiumtransport.com",
  "https://dgpremium.framer.website",
]

module.exports = async function handler(req, res) {
  const origin = req.headers.origin

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
  }

  res.setHeader("Vary", "Origin")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    })
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body

    const {
      name,
      email,
      phone,
      dateTime,
      pickup,
      dropoff,
      message,
      source,
    } = body || {}

    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields",
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid email",
      })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.CONTACT_TO,
      replyTo: email,
      subject: "New quote request from DG Premium Transport Group",
      text: `
Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}
Preferred date & time: ${dateTime || "Not provided"}
Pickup location: ${pickup || "Not provided"}
Drop-off location: ${dropoff || "Not provided"}
Source: ${source || "Not provided"}

Message:
${message}
      `.trim(),
      html: `
        <h2>New quote request from DG Premium Transport Group</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
        <p><strong>Preferred date &amp; time:</strong> ${escapeHtml(dateTime || "Not provided")}</p>
        <p><strong>Pickup location:</strong> ${escapeHtml(pickup || "Not provided")}</p>
        <p><strong>Drop-off location:</strong> ${escapeHtml(dropoff || "Not provided")}</p>
        <p><strong>Source:</strong> ${escapeHtml(source || "Not provided")}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
      `,
    })

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error("DG CONTACT API ERROR:", error)
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    })
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}