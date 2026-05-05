const express = require('express');
const multer = require('multer');
const { Telegraf } = require('telegraf');

const app = express();
// Cấu hình multer để nhận file vào bộ nhớ đệm (RAM) trước khi gửi đi
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // Giới hạn file 50MB theo chuẩn Telegram Bot
});

// Lấy thông số từ môi trường (Render)
const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL_ID = process.env.CHANNEL_ID;

// API chính để Flutter gọi lên
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Không tìm thấy file nào được gửi lên' });

    console.log(`Đang xử lý file: ${file.originalname}`);

    // Gửi file sang Telegram Channel
    // Sử dụng sendDocument để giữ nguyên chất lượng gốc của ảnh/video/voice
    const result = await bot.telegram.sendDocument(CHANNEL_ID, {
      source: file.buffer,
      filename: file.originalname
    });

    // Lấy link truy cập file (Link này có thể hết hạn sau 1 giờ)
    const fileId = result.document ? result.document.file_id : result.photo[result.photo.length - 1].file_id;
    const fileLink = await bot.telegram.getFileLink(fileId);

    // Trả kết quả về cho Flutter
    res.json({ 
      success: true,
      url: fileLink.href, 
      file_id: fileId 
    });

  } catch (error) {
    console.error('Lỗi Telegram:', error);
    res.status(500).json({ error: 'Lỗi server khi đẩy file sang Telegram' });
  }
});

// Trang chủ để kiểm tra server có sống không
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BDPOS Storage System</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: 'Inter', sans-serif;
                background-color: #0f172a;
                color: #f8fafc;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                overflow: hidden;
            }
            .container {
                text-align: center;
                padding: 40px;
                background: rgba(30, 41, 59, 0.7);
                backdrop-filter: blur(10px);
                border-radius: 24px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                max-width: 400px;
                width: 90%;
            }
            .status-dot {
                width: 12px;
                height: 12px;
                background-color: #22c55e;
                border-radius: 50%;
                display: inline-block;
                margin-right: 8px;
                box-shadow: 0 0 15px #22c55e;
                animation: pulse 2s infinite;
            }
            h1 {
                font-weight: 900;
                font-size: 24px;
                letter-spacing: -0.025em;
                margin-bottom: 16px;
                background: linear-gradient(to right, #38bdf8, #818cf8);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            p {
                color: #94a3b8;
                font-size: 14px;
                line-height: 1.6;
            }
            .badge {
                display: inline-flex;
                align-items: center;
                background: rgba(34, 197, 94, 0.1);
                color: #4ade80;
                padding: 6px 16px;
                border-radius: 9999px;
                font-size: 12px;
                font-weight: 700;
                margin-bottom: 24px;
            }
            @keyframes pulse {
                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="badge">
                <span class="status-dot"></span> ĐANG TRỰC TUYẾN
            </div>
            <h1>BDPOS STORAGE SYSTEM</h1>
            <p>Hệ thống lưu trữ đám mây nội bộ dành riêng cho Đại ca Hồ Bảo Duy. Tối ưu, bảo mật và vô hạn.</p>
        </div>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang lắng nghe tại cổng ${PORT}`);
});
