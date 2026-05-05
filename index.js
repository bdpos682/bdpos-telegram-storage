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
  res.send('<h1>Server Storage BDPOS đang chạy!</h1><p>Đại ca có thể yên tâm sử dụng.</p>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang lắng nghe tại cổng ${PORT}`);
});