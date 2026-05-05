const express = require('express');
const multer = require('multer');
const { Telegraf } = require('telegraf');
const os = require('os');
const fs = require('fs'); // Thêm module quản lý File System

const app = express();

// 🚀 TỐI ƯU SIÊU CHỊU TẢI: Lưu tạm vào Ổ cứng (Disk) thay vì RAM
const upload = multer({ 
  dest: os.tmpdir(), // Sử dụng thư mục tạm của hệ điều hành (dung lượng cực lớn)
  limits: { 
    fileSize: 20 * 1024 * 1024 // Giới hạn 20MB (ảnh nén ở Flutter chỉ vài trăm KB là dư sức)
  } 
});

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL_ID = process.env.CHANNEL_ID;

// Hàm lấy thông số hệ thống
function getSystemStats() {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  return {
    nodeVersion: process.version,
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    memory: `${(os.freemem() / 1024 / 1024).toFixed(0)}MB / ${(os.totalmem() / 1024 / 1024).toFixed(0)}MB`,
    platform: os.platform() === 'linux' ? 'Linux (Render)' : os.platform(),
    timestamp: new Date().toLocaleTimeString('vi-VN')
  };
}

// API Endpoint để Client lấy dữ liệu realtime
app.get('/api/stats', (req, res) => {
  res.json(getSystemStats());
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Không tìm thấy tệp' });

    // 🚀 Dùng ReadStream: Đọc từng mảnh nhỏ từ ổ cứng và bơm thẳng sang Telegram
    const fileStream = fs.createReadStream(file.path);

    const result = await bot.telegram.sendDocument(CHANNEL_ID, {
      source: fileStream,
      filename: file.originalname
    });

    // 🚀 Dọn rác tức thì: Xóa ngay file tạm trên ổ cứng sau khi Telegram nhận xong
    fs.unlink(file.path, (err) => {
        if (err) console.error('Lỗi khi xóa file tạm:', err);
    });

    const fileId = result.document ? result.document.file_id : result.photo[result.photo.length - 1].file_id;
    const fileLink = await bot.telegram.getFileLink(fileId);
    
    res.json({ success: true, url: fileLink.href, file_id: fileId });
    
  } catch (error) {
    console.error('Lỗi máy chủ:', error);
    
    // Kể cả khi có lỗi cũng phải dọn rác để chống tràn ổ cứng
    if (req.file && req.file.path) {
        fs.unlink(req.file.path, () => {});
    }
    
    res.status(500).json({ error: 'Hệ thống đang quá tải, vui lòng thử lại sau.' });
  }
});

app.get('/', (req, res) => {
  const stats = getSystemStats();
  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BDPOS | Realtime Console</title>
        <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;600;800&display=swap" rel="stylesheet">
        <style>
            :root {
                --bg-dark: #020617; --card-bg: #0f172a; --accent: #38bdf8;
                --text-primary: #f1f5f9; --text-secondary: #94a3b8;
                --border: rgba(255, 255, 255, 0.08); --success: #10b981;
            }
            body { margin: 0; padding: 0; font-family: 'Lexend', sans-serif; background-color: var(--bg-dark); color: var(--text-primary); display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .console-card { background: var(--card-bg); width: 100%; max-width: 600px; margin: 20px; border-radius: 24px; border: 1px solid var(--border); box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8); overflow: hidden; }
            .header { padding: 30px; border-bottom: 1px solid var(--border); background: linear-gradient(135deg, rgba(15,23,42,0.8), rgba(2,6,23,0.8)); }
            .status-bar { display: flex; align-items: center; gap: 10px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); padding: 6px 14px; border-radius: 50px; width: fit-content; margin-bottom: 20px; }
            .dot { width: 8px; height: 8px; background: var(--success); border-radius: 50%; box-shadow: 0 0 10px var(--success); animation: pulse 2s infinite; }
            .status-text { font-size: 11px; font-weight: 700; letter-spacing: 1px; color: var(--success); }
            h1 { font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px; color: var(--text-primary); }
            .content { padding: 30px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-box { padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 16px; transition: all 0.3s ease; }
            .label { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; display: block; }
            .value { font-size: 14px; font-weight: 600; color: var(--accent); }
            .log-box { background: #000; border-radius: 12px; padding: 15px; font-family: 'Courier New', monospace; font-size: 12px; color: #22c55e; border: 1px solid #1e293b; min-height: 60px; }
            .log-line { margin-bottom: 5px; display: flex; gap: 10px; opacity: 0; animation: fadeIn 0.5s forwards; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            .footer { padding: 20px; text-align: center; font-size: 11px; color: var(--text-secondary); opacity: 0.6; }
        </style>
    </head>
    <body>
        <div class="console-card">
            <div class="header">
                <div class="status-bar"><div class="dot"></div><span class="status-text">HỆ THỐNG TRỰC TUYẾN</span></div>
                <h1>CƠ SỞ DỮ LIỆU BDPOS</h1>
            </div>
            <div class="content">
                <div class="info-grid">
                    <div class="info-box"><span class="label">Phiên bản Node</span><span class="value" id="nodeVersion">${stats.nodeVersion}</span></div>
                    <div class="info-box"><span class="label">Thời gian chạy</span><span class="value" id="uptime">${stats.uptime}</span></div>
                    <div class="info-box"><span class="label">Bộ nhớ RAM</span><span class="value" id="memory">${stats.memory}</span></div>
                    <div class="info-box"><span class="label">Máy chủ</span><span class="value" id="platform">${stats.platform}</span></div>
                </div>
                <div class="log-box" id="logBox">
                    <div class="log-line"><span style="color:#475569">[${stats.timestamp}]</span> <span>Hệ thống đã sẵn sàng xử lý dữ liệu.</span></div>
                </div>
            </div>
            <div class="footer">Bản quyền &copy; 2026 BDPOS Technology</div>
        </div>

        <script>
            async function updateStats() {
                try {
                    const res = await fetch('/api/stats');
                    const data = await res.json();
                    
                    // Cập nhật các chỉ số
                    document.getElementById('nodeVersion').innerText = data.nodeVersion;
                    document.getElementById('uptime').innerText = data.uptime;
                    document.getElementById('memory').innerText = data.memory;
                    document.getElementById('platform').innerText = data.platform;

                    // Thêm dòng log mới
                    const logBox = document.getElementById('logBox');
                    const newLine = document.createElement('div');
                    newLine.className = 'log-line';
                    newLine.innerHTML = '<span style="color:#475569">[' + data.timestamp + ']</span> <span>Đang duy trì luồng dữ liệu (Stream) ổn định...</span>';
                    
                    if (logBox.children.length > 2) logBox.removeChild(logBox.children[0]);
                    logBox.appendChild(newLine);
                } catch (e) {
                    console.error("Lỗi cập nhật:", e);
                }
            }

            // Cập nhật mỗi 5 giây
            setInterval(updateStats, 5000);
        </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Live on port ${PORT}`));
