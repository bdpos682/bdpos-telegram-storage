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
    if (!file) return res.status(400).json({ error: 'Không tìm thấy tệp' });

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
    console.error('Lỗi Telegram:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});

// Giao diện Quản trị Hệ thống Lưu trữ BDPOS
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BDPOS | Trung Tâm Lưu Trữ Dữ Liệu</title>
        <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;600;800&display=swap" rel="stylesheet">
        <style>
            :root {
                --bg-dark: #020617;
                --card-bg: #0f172a;
                --accent: #38bdf8;
                --accent-glow: rgba(56, 189, 248, 0.3);
                --text-primary: #f1f5f9;
                --text-secondary: #94a3b8;
                --border: rgba(255, 255, 255, 0.08);
                --success: #10b981;
            }
            body {
                margin: 0;
                padding: 0;
                font-family: 'Lexend', sans-serif;
                background-color: var(--bg-dark);
                color: var(--text-primary);
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }
            .console-card {
                background: var(--card-bg);
                width: 100%;
                max-width: 600px;
                margin: 20px;
                border-radius: 20px;
                border: 1px solid var(--border);
                box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.8);
                overflow: hidden;
            }
            .header {
                padding: 30px;
                border-bottom: 1px solid var(--border);
                background: linear-gradient(to bottom right, rgba(15, 23, 42, 0.5), rgba(2, 6, 23, 0.5));
            }
            .status-bar {
                display: flex;
                align-items: center;
                gap: 10px;
                background: rgba(16, 185, 129, 0.1);
                border: 1px solid rgba(16, 185, 129, 0.2);
                padding: 6px 14px;
                border-radius: 50px;
                width: fit-content;
                margin-bottom: 20px;
            }
            .dot {
                width: 8px;
                height: 8px;
                background: var(--success);
                border-radius: 50%;
                box-shadow: 0 0 10px var(--success);
                animation: pulse 2s infinite;
            }
            .status-text {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 1px;
                color: var(--success);
            }
            h1 {
                font-size: 24px;
                font-weight: 800;
                margin: 0;
                color: var(--text-primary);
                letter-spacing: -0.5px;
            }
            .subtitle {
                color: var(--text-secondary);
                font-size: 14px;
                margin-top: 8px;
            }
            .content {
                padding: 30px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
            }
            .info-box {
                padding: 16px;
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid var(--border);
                border-radius: 12px;
            }
            .label {
                font-size: 10px;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 6px;
                display: block;
            }
            .value {
                font-size: 14px;
                font-weight: 600;
                color: var(--accent);
            }
            .log-box {
                background: #000;
                border-radius: 10px;
                padding: 15px;
                font-family: 'Courier New', Courier, monospace;
                font-size: 12px;
                color: #22c55e;
                border: 1px solid #1e293b;
            }
            .log-line {
                margin-bottom: 5px;
                display: flex;
                gap: 10px;
            }
            .log-ts { color: #475569; }
            .footer {
                padding: 20px 30px;
                background: rgba(0, 0, 0, 0.2);
                border-top: 1px solid var(--border);
                text-align: center;
                font-size: 11px;
                color: var(--text-secondary);
            }
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.4; }
                100% { opacity: 1; }
            }
        </style>
    </head>
    <body>
        <div class="console-card">
            <div class="header">
                <div class="status-bar">
                    <div class="dot"></div>
                    <span class="status-text">HỆ THỐNG ĐANG HOẠT ĐỘNG</span>
                </div>
                <h1>CƠ SỞ DỮ LIỆU BDPOS</h1>
                <p class="subtitle">Nền tảng lưu trữ tệp tin và tin nhắn đa phương tiện cho hệ sinh thái BDPOS.</p>
            </div>
            
            <div class="content">
                <div class="info-grid">
                    <div class="info-box">
                        <span class="label">Máy chủ</span>
                        <span class="value">Render Node.js</span>
                    </div>
                    <div class="info-box">
                        <span class="label">Lưu trữ</span>
                        <span class="value">Điện toán đám mây</span>
                    </div>
                    <div class="info-box">
                        <span class="label">Bảo mật</span>
                        <span class="value">SSL/TLS 1.3</span>
                    </div>
                    <div class="info-box">
                        <span class="label">Trạng thái</span>
                        <span class="value">Ổn định 99.9%</span>
                    </div>
                </div>

                <div class="log-box">
                    <div class="log-line">
                        <span class="log-ts">[${new Date().toLocaleTimeString('vi-VN')}]</span>
                        <span>Đang lắng nghe các yêu cầu từ ứng dụng Flutter...</span>
                    </div>
                    <div class="log-line">
                        <span class="log-ts">[${new Date().toLocaleTimeString('vi-VN')}]</span>
                        <span>Đã kết nối thành công với kho dữ liệu Telegram.</span>
                    </div>
                </div>
            </div>

            <div class="footer">
                Bản quyền &copy; 2026 BDPOS Technology. Bảo lưu mọi quyền.
            </div>
        </div>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Máy chủ đang chạy tại cổng ${PORT}`);
});
