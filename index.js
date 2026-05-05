const express = require('express');
const multer = require('multer');
const { Telegraf } = require('telegraf');

const app = express();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } 
});

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL_ID = process.env.CHANNEL_ID;

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const result = await bot.telegram.sendDocument(CHANNEL_ID, {
      source: file.buffer,
      filename: file.originalname
    });

    const fileId = result.document ? result.document.file_id : result.photo[result.photo.length - 1].file_id;
    const fileLink = await bot.telegram.getFileLink(fileId);

    res.json({ 
      success: true,
      url: fileLink.href, 
      file_id: fileId 
    });

  } catch (error) {
    console.error('Telegram Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Giao diện chuyên nghiệp cho trang quản trị hệ thống
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BDPOS | Cloud Storage Service</title>
        <script src="https://unpkg.com/lucide@latest"></script>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
            :root {
                --primary: #6366f1;
                --bg: #0b0f1a;
                --card: #161c2d;
                --text-main: #ffffff;
                --text-sub: #94a3b8;
                --success: #10b981;
            }
            body {
                margin: 0;
                padding: 0;
                font-family: 'Plus Jakarta Sans', sans-serif;
                background-color: var(--bg);
                color: var(--text-main);
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }
            .dashboard {
                background: var(--card);
                padding: 48px;
                border-radius: 32px;
                border: 1px solid rgba(255, 255, 255, 0.05);
                box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.5);
                max-width: 450px;
                width: 90%;
                position: relative;
            }
            .status-wrapper {
                display: flex;
                align-items: center;
                gap: 8px;
                background: rgba(16, 185, 129, 0.1);
                color: var(--success);
                padding: 8px 16px;
                border-radius: 12px;
                font-size: 13px;
                font-weight: 600;
                width: fit-content;
                margin: 0 auto 32px;
            }
            .pulse {
                width: 8px;
                height: 8px;
                background: var(--success);
                border-radius: 50%;
                box-shadow: 0 0 10px var(--success);
                animation: blink 2s infinite;
            }
            h1 {
                font-size: 28px;
                font-weight: 800;
                margin: 0 0 12px;
                letter-spacing: -0.5px;
            }
            .tagline {
                color: var(--text-sub);
                font-size: 15px;
                line-height: 1.6;
                margin-bottom: 40px;
            }
            .stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                text-align: left;
            }
            .stat-item {
                background: rgba(255, 255, 255, 0.03);
                padding: 16px;
                border-radius: 16px;
                border: 1px solid rgba(255, 255, 255, 0.03);
            }
            .stat-label {
                font-size: 11px;
                color: var(--text-sub);
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 4px;
                display: block;
            }
            .stat-value {
                font-weight: 600;
                font-size: 14px;
            }
            @keyframes blink {
                0% { opacity: 1; }
                50% { opacity: 0.4; }
                100% { opacity: 1; }
            }
            .footer {
                margin-top: 40px;
                font-size: 12px;
                color: rgba(148, 163, 184, 0.5);
            }
        </style>
    </head>
    <body>
        <div class="dashboard">
            <div class="status-wrapper">
                <div class="pulse"></div>
                SYSTEM OPERATIONAL
            </div>
            <h1>BDPOS Core Storage</h1>
            <p class="tagline">Hệ thống lưu trữ trung tâm dành cho các giải pháp phần mềm BDPOS. Đảm bảo hiệu suất và bảo mật dữ liệu tối ưu.</p>
            
            <div class="stats">
                <div class="stat-item">
                    <span class="stat-label">Platform</span>
                    <span class="stat-value">Render Node.js</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Storage</span>
                    <span class="stat-value">Private Cloud</span>
                </div>
            </div>

            <div class="footer">
                &copy; 2026 BDPOS Technology Integration. All rights reserved.
            </div>
        </div>
        <script>lucide.createIcons();</script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
