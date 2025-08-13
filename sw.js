// 顯示當前日期
function updateDate() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        weekday: 'long' 
    };
    document.getElementById('currentDate').textContent = 
        now.toLocaleDateString('zh-TW', options);
}

// 情緒按鈕選擇
function initEmotionButtons() {
    document.querySelectorAll('.emotion-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// 保存今日記錄
function saveDaily() {
    const today = new Date().toLocaleDateString('zh-TW');
    const verseRef = document.getElementById('verseReference').value;
    const verseContent = document.getElementById('verseContent').value;
    const devotion = document.getElementById('devotionContent').value;
    const emotionNote = document.getElementById('emotionNote').value;
    const selectedEmotion = document.querySelector('.emotion-btn.active');
    
    if (!verseContent && !devotion && !emotionNote) {
        alert('請至少填寫一項內容再保存！');
        return;
    }

    const record = {
        date: today,
        timestamp: Date.now(),
        verseReference: verseRef,
        verse: verseContent,
        devotion: devotion,
        emotion: selectedEmotion ? selectedEmotion.dataset.emotion : '',
        emotionNote: emotionNote
    };

    // 儲存到記憶體陣列（實際應用中應該使用資料庫）
    let records = JSON.parse(localStorage.getItem('devotionRecords') || '[]');
    
    // 檢查今天是否已有記錄，如果有就更新
    const existingIndex = records.findIndex(r => r.date === today);
    if (existingIndex >= 0) {
        records[existingIndex] = record;
    } else {
        records.unshift(record);
    }
    
    // 只保留最近30天的記錄
    records = records.slice(0, 30);
    localStorage.setItem('devotionRecords', JSON.stringify(records));

    // 顯示保存成功訊息
    const savedMsg = document.getElementById('savedMessage');
    savedMsg.style.display = 'block';
    setTimeout(() => {
        savedMsg.style.display = 'none';
    }, 3000);

    // 更新歷史記錄顯示
    updateHistory();
}

// 更新歷史記錄顯示
function updateHistory() {
    const records = JSON.parse(localStorage.getItem('devotionRecords') || '[]');
    const historyList = document.getElementById('historyList');
    
    if (records.length === 0) {
        historyList.innerHTML = '<div class="history-item"><div class="history-date">開始你的靈修旅程</div><div class="history-content">歡迎使用聖靈靈修網站，願主與你同行！</div></div>';
        return;
    }

    historyList.innerHTML = records.slice(0, 5).map(record => `
        <div class="history-item">
            <div class="history-date">${record.date} ${record.emotion ? '- ' + record.emotion : ''}</div>
            <div class="history-content">
                ${record.verseReference ? `📖 ${record.verseReference}` : ''}
                ${record.verse ? `<br>${record.verse.substring(0, 100)}${record.verse.length > 100 ? '...' : ''}` : ''}
                ${record.devotion ? `<br>🙏 ${record.devotion.substring(0, 100)}${record.devotion.length > 100 ? '...' : ''}` : ''}
            </div>
        </div>
    `).join('');
}

// 載入今日已有的記錄
function loadTodayRecord() {
    const today = new Date().toLocaleDateString('zh-TW');
    const records = JSON.parse(localStorage.getItem('devotionRecords') || '[]');
    const todayRecord = records.find(r => r.date === today);
    
    if (todayRecord) {
        document.getElementById('verseReference').value = todayRecord.verseReference || '';
        document.getElementById('verseContent').value = todayRecord.verse || '';
        document.getElementById('devotionContent').value = todayRecord.devotion || '';
        document.getElementById('emotionNote').value = todayRecord.emotionNote || '';
        
        if (todayRecord.emotion) {
            const emotionBtn = document.querySelector(`[data-emotion="${todayRecord.emotion}"]`);
            if (emotionBtn) emotionBtn.classList.add('active');
        }
    }
}

// 初始化應用程式
function initApp() {
    updateDate();
    initEmotionButtons();
    updateHistory();
    loadTodayRecord();
    initPWA();
    
    // 每分鐘更新一次日期
    setInterval(updateDate, 60000);
}

// PWA 初始化
function initPWA() {
    // 註冊 Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }

    // PWA 安裝提示
    let deferredPrompt;
    const installPrompt = document.getElementById('installPrompt');
    const installBtn = document.getElementById('installBtn');
    const dismissBtn = document.getElementById('dismissBtn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // 檢查是否已經安裝或已經顯示過提示
        if (!localStorage.getItem('pwaPromptDismissed')) {
            setTimeout(() => {
                installPrompt.style.display = 'block';
                installPrompt.classList.add('show');
            }, 5000); // 5秒後顯示
        }
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
            }
            hideInstallPrompt();
        });
    }

    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            localStorage.setItem('pwaPromptDismissed', 'true');
            hideInstallPrompt();
        });
    }

    function hideInstallPrompt() {
        installPrompt.classList.remove('show');
        setTimeout(() => {
            installPrompt.style.display = 'none';
        }, 300);
    }

    // 監聽安裝成功事件
    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        hideInstallPrompt();
    });
}

// 離線支援 - 保存資料到本地
function saveToLocalStorage(data) {
    try {
        localStorage.setItem('devotionRecords', JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('儲存失敗:', error);
        return false;
    }
}

// 網路狀態檢測
function checkNetworkStatus() {
    const updateOnlineStatus = () => {
        const isOnline = navigator.onLine;
        const statusIndicator = document.querySelector('.network-status');
        
        if (!statusIndicator) {
            const indicator = document.createElement('div');
            indicator.className = 'network-status';
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 12px;
                z-index: 999;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(indicator);
        }
        
        const indicator = document.querySelector('.network-status');
        
        if (isOnline) {
            indicator.textContent = '🟢 已連線';
            indicator.style.background = '#d4edda';
            indicator.style.color = '#155724';
        } else {
            indicator.textContent = '🔴 離線模式';
            indicator.style.background = '#f8d7da';
            indicator.style.color = '#721c24';
        }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
}

// 當頁面載入完成時執行初始化
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    checkNetworkStatus();
});