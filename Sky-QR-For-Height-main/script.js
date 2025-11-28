// ==========================================
// Sky QR Height Calculator - Integrated Version
// UI Framework: dream10325
// Parsing Algorithm: Enhanced 3-format support
// ==========================================

let currentLang = 'zh-Hans';

const backgroundImages = [
    'images/bg1.png',
    'images/bg2.png',
    'images/bg3.png',
    'images/bg4.png',
    'images/bg5.png',
    'images/bg6.png',
    'images/bg7.png',
    'images/bg8.png'
];

const backgroundGradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%, #fecfef 100%)'
];

let currentHistoryFilter = 'all';
let historySearchTerm = '';
const HISTORY_RECENT_LIMIT = 10;

function setLanguage(lang) {
    currentLang = lang;
    
    // 更新页面文本
    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.getAttribute('data-lang-key');
        if (translations[lang] && translations[lang][key]) {
            if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search')) {
                el.placeholder = translations[lang][key];
            } else if (el.tagName === 'TEXTAREA') {
                el.placeholder = translations[lang][key];
            } else {
                // 检查翻译文本是否包含 HTML 标签
                const text = translations[lang][key];
                if (text.includes('<b>') || text.includes('<br>') || text.includes('<ul>') || text.includes('<code>')) {
                    el.innerHTML = text;
                } else {
                    el.textContent = text;
                }
            }
        }
    });
    
    // 更新导航栏语言显示
    const langMap = {
        'zh-Hans': '简',
        'en': 'En',
    };
    const currentLangEl = document.getElementById('current-lang');
    if (currentLangEl) {
        currentLangEl.textContent = langMap[lang] || '简中';
    }
    
    localStorage.setItem('language', lang);
    
    // 更新活跃状态
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.toggle('active', opt.getAttribute('data-lang') === lang);
    });
}

function t(key) {
    return (translations[currentLang] && translations[currentLang][key]) || key;
}

function updateThemeIcon(theme) {
    const lightIcon = document.getElementById('theme-icon-light');
    const darkIcon = document.getElementById('theme-icon-dark');
    if (theme === 'dark') {
        lightIcon.style.display = 'none';
        darkIcon.style.display = 'block';
    } else {
        lightIcon.style.display = 'block';
        darkIcon.style.display = 'none';
    }
}

function animateValue(element, start, end, duration = 500, decimals = 4) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = progress * (end - start) + start;
        element.textContent = current.toFixed(decimals);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// ==========================================
// OUR ENHANCED PARSING ALGORITHM
// Supports 3 QR code formats with Protobuf
// ==========================================

function parseSkyQRCode(b64) {
    // 0. Clean Base64 string - remove non-standard characters
    let cleaned = '';
    for (let i = 0; i < b64.length; i++) {
        const char = b64[i];
        const code = b64.charCodeAt(i);
        if ((code >= 65 && code <= 90) ||   // A-Z
            (code >= 97 && code <= 122) ||  // a-z
            (code >= 48 && code <= 57) ||   // 0-9
            char === '+' || char === '/' || char === '=' || char === '-' || char === '_') {
            if (char === '-') {
                cleaned += '+';
            } else if (char === '_') {
                cleaned += '/';
            } else {
                cleaned += char;
            }
        }
    }
    
    // 1. Pad Base64
    const padded = cleaned.padEnd(cleaned.length + (4 - cleaned.length % 4) % 4, '=');
    
    // 2. Decode to byte array
    const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
    
    // 3. Decode as latin1 (preserve all bytes)
    let raw = '';
    for (let i = 0; i < bytes.length; i++) {
        raw += String.fromCharCode(bytes[i]);
    }
    
    // 4. Find first { position
    const start = raw.indexOf('{');
    if (start === -1) throw new Error('Invalid data');
    
    // 5. Extract height (using regex)
    const heightMatch = raw.match(/eight"[^:=\d\-.eE]{0,5}[:=]\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/i);
    if (!heightMatch) throw new Error('Cannot extract height');
    let height = parseFloat(heightMatch[1]);
    
    // 6. Extract scale (using precise protobuf parsing)
    let scale = null;
    
    // Find "scale" string position
    const scaleBytes = [0x73, 0x63, 0x61, 0x6c, 0x65]; // "scale"
    let scaleIndex = -1;
    for (let i = 0; i < bytes.length - 5; i++) {
        let match = true;
        for (let j = 0; j < 5; j++) {
            if (bytes[i + j] !== scaleBytes[j]) {
                match = false;
                break;
            }
        }
        if (match) {
            scaleIndex = i;
            break;
        }
    }
    
    if (scaleIndex !== -1 && scaleIndex + 9 < bytes.length) {
        // Sky QR encoding: "scale" + 0x15 + [3 control bytes] + ASCII digits
        const pbMarker = bytes[scaleIndex + 5];
        
        if (pbMarker === 0x15) {
            // Read ASCII digits from scaleIndex + 9
            let digitStr = '';
            for (let i = scaleIndex + 9; i < bytes.length; i++) {
                const byte = bytes[i];
                if (byte >= 0x30 && byte <= 0x39) { // '0'-'9'
                    digitStr += String.fromCharCode(byte);
                } else {
                    break;
                }
            }
            
            if (digitStr.length > 0) {
                // Sky encoding rule: ASCII digits × 10^-10
                // Example: "72681494" × 10^-10 = 0.0072681494
                const numValue = parseInt(digitStr);
                scale = numValue * 1e-10;
                
                // Verify within reasonable range [-0.2, 0.2]
                if (scale < -0.2 || scale > 0.2) {
                    const candidates = [1e-8, 1e-6, 1e-4, 1e-2];
                    for (const factor of candidates) {
                        const testValue = numValue * factor;
                        if (testValue >= -0.2 && testValue <= 0.2) {
                            scale = testValue;
                            break;
                        }
                    }
                }
            }
        }
    }
    
    // Fallback: if protobuf parsing failed, use regex
    if (scale === null) {
        const scaleMatch = raw.match(/scale[^\d]*?(\d+\.?\d*(?:[eE][+-]?\d+)?)/i);
        if (!scaleMatch) throw new Error('Cannot extract scale');
        
        const scaleRaw = scaleMatch[1];
        // If 8-digit integer (no decimal), convert to 0.00xxxxxxxx
        if (scaleRaw.length === 8 && !scaleRaw.includes('.') && !scaleRaw.includes('e') && !scaleRaw.includes('E')) {
            scale = parseFloat('0.00' + scaleRaw);
        } else {
            scale = parseFloat(scaleRaw);
        }
    }
    
    // 7. Try to parse complete JSON (for display and extract ID)
    let jsonData = null;
    let extractedId = null;
    
    // 首先尝试提取 ID（即使 JSON 不完整也能提取）
    try {
        const idMatch = raw.match(/"id"\s*:\s*(\d+)/);
        if (idMatch) {
            extractedId = idMatch[1];
            console.log('Extracted ID:', extractedId);
        }
    } catch (e) {
        console.log('ID extraction failed:', e.message);
    }
    
    // 尝试解析完整 JSON
    try {
        const jsonPart = raw.slice(start);
        
        // 方法1: 尝试逐个字段提取关键信息
        const fieldsToExtract = ['id', 'tex', 'voice', 'attitude', 'refreshversion'];
        const extractedFields = {};
        
        fieldsToExtract.forEach(field => {
            // 匹配字符串值
            const strMatch = jsonPart.match(new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`, 'i'));
            if (strMatch) {
                extractedFields[field] = strMatch[1];
                return;
            }
            // 匹配数字值
            const numMatch = jsonPart.match(new RegExp(`"${field}"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`, 'i'));
            if (numMatch) {
                extractedFields[field] = parseFloat(numMatch[1]);
            }
        });
        
        // 方法2: 尝试清理并解析完整 JSON
        let cleaned = '';
        for (let i = 0; i < jsonPart.length; i++) {
            const code = jsonPart.charCodeAt(i);
            if ((code >= 0x20 && code <= 0x7E) || code === 0x09 || code === 0x0A || code === 0x0D) {
                cleaned += jsonPart[i];
            }
        }
        
        // 尝试找到第一个完整的 JSON 对象
        let braceCount = 0;
        let jsonEnd = -1;
        for (let i = 0; i < cleaned.length; i++) {
            if (cleaned[i] === '{') braceCount++;
            if (cleaned[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                    jsonEnd = i + 1;
                    break;
                }
            }
        }
        
        if (jsonEnd > 0) {
            const jsonStr = cleaned.substring(0, jsonEnd);
            jsonData = JSON.parse(jsonStr);
        } else {
            jsonData = extractedFields;
        }
        
        // 确保 ID 被包含
        if (extractedId && !jsonData.id) {
            jsonData.id = extractedId;
        }
        
        console.log('Parsed complete JSON:', jsonData);
    } catch (e) {
        console.log('JSON parse error:', e.message);
        jsonData = { height, scale };
        if (extractedId) {
            jsonData.id = extractedId;
        }
    }
    
    // 9. Calculate heights
    let currentHeight = null;
    let maxHeight = null;
    let minHeight = null;
    
    if (height !== null && scale !== null) {
        currentHeight = 7.6 - 8.3 * scale - 3 * height;
    }
    
    if (scale !== null) {
        maxHeight = 7.6 - 8.3 * scale - 3 * 2.0;
        minHeight = 7.6 - 8.3 * scale - 3 * (-2.0);
    }
    
    return {
        height,
        scale,
        currentHeight,
        maxHeight,
        minHeight,
        raw: raw.slice(start, start + 500),
        jsonData,
        originalBytes: bytes
    };
}

// ==========================================
// ADAPTER FUNCTION
// Converts our format to dream10325's format
// ==========================================

function decodeAndCalculate(rawData) {
    try {
        const startMarker = "ImJvZHki";
        const startIndex = rawData.indexOf(startMarker);
        
        if (startIndex === -1) {
            return { error: t('status_error_general') };
        }
        
        let b64Str = rawData.substring(startIndex);
        const result = parseSkyQRCode(b64Str);
        
        return {
            current: result.currentHeight,
            tallest: result.maxHeight,
            shortest: result.minHeight,
            scale: result.scale,
            timestamp: new Date().getTime(),
            note: "",
            json: {
                height_raw: result.height,
                scale_raw: result.scale,
                ...result.jsonData
            }
        };
    } catch (e) {
        console.error('Parse error:', e);
        return { error: t('status_error_general') };
    }
}

// ==========================================
// UI EVENT HANDLERS (dream10325's framework)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('language') || 'zh-Hans';
    setLanguage(savedLang);

    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // 语言切换菜单
    const langBtn = document.getElementById('lang-btn');
    const langMenu = document.getElementById('lang-menu');
    const langWrapper = langBtn.closest('.lang-switcher-wrapper');

    langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = langMenu.style.display === 'block';
        langMenu.style.display = isVisible ? 'none' : 'block';
        langWrapper.classList.toggle('active', !isVisible);
    });

    // 点击外部关闭菜单
    document.addEventListener('click', (e) => {
        if (!langBtn.contains(e.target) && !langMenu.contains(e.target)) {
            langMenu.style.display = 'none';
            langWrapper.classList.remove('active');
        }
    });

    // 语言选项点击
    document.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.getAttribute('data-lang');
            const shortName = option.getAttribute('data-short');
            setLanguage(lang);
            document.getElementById('current-lang').textContent = shortName;
            langMenu.style.display = 'none';
            langWrapper.classList.remove('active');
            loadHistory();
        });
    });

    // 主题切换
    document.getElementById('theme-btn').addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    // 初始化设置面板
    setupSettingsPanel();

    // 更多设置按钮
    document.getElementById('more-settings-btn').addEventListener('click', () => {
        openSettingsPanel();
    });

    // 教程按钮
    document.getElementById('tutorial-btn').addEventListener('click', () => {
        openTutorial();
    });

    document.getElementById('decode-btn').addEventListener('click', () => {
        const rawData = document.getElementById('raw-data').value.trim();
        if (!rawData) {
            showStatus(t('status_empty'), 'error');
            return;
        }

        const result = decodeAndCalculate(rawData);
        if (result.error) {
            showStatus(result.error, 'error');
            document.getElementById('results').style.display = 'none';
        } else {
            displayResult(result);
            addToHistory(result);
            showStatus(t('status_success'), 'success');
        }
    });

    const qrUploadArea = document.getElementById('qr-upload-area');
    const qrFileInput = document.getElementById('qr-file-input');

    qrUploadArea.addEventListener('click', () => {
        qrFileInput.click();
    });

    qrUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        qrUploadArea.classList.add('dragover');
    });

    qrUploadArea.addEventListener('dragleave', () => {
        qrUploadArea.classList.remove('dragover');
    });

    qrUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        qrUploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) {
            processQRImage(file);
        }
    });

    qrFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        console.log('QR file selected:', file ? file.name : 'none');
        if (file) {
            processQRImage(file);
            // 清空input值，允许重复上传
            setTimeout(() => {
                e.target.value = '';
                console.log('Input cleared');
            }, 100);
        }
    });

    function processQRImage(file) {
        console.log('Processing QR image:', file.name, 'Size:', file.size);
        showStatus(t('status_processing') || '正在处理...', 'info');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // 获取原始尺寸
                    const maxSize = 1500;
                    let width = img.width;
                    let height = img.height;
                    
                    // 如果图片太大，缩小以提高处理速度
                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = (height / width) * maxSize;
                            width = maxSize;
                        } else {
                            width = (width / height) * maxSize;
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    console.log('Canvas size:', width, 'x', height);
                    console.log('Scanning QR code...');
                    
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    // 尝试多种扫描方式
                    let code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert"
                    });
                    
                    if (!code) {
                        console.log('First attempt failed, trying with inversion...');
                        code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "attemptBoth"
                        });
                    }

                    if (code && code.data) {
                        console.log('✓ QR code detected!');
                        console.log('Data length:', code.data.length);
                        console.log('Data preview:', code.data.substring(0, 100));
                        
                        // 强制更新输入框
                        const rawDataInput = document.getElementById('raw-data');
                        rawDataInput.value = '';
                        setTimeout(() => {
                            rawDataInput.value = code.data;
                            console.log('Input updated with new data');
                            showStatus(t('status_qr_detected'), 'success');
                            
                            // 再延迟一下点击解析按钮
                            setTimeout(() => {
                                console.log('Triggering decode...');
                                document.getElementById('decode-btn').click();
                            }, 100);
                        }, 50);
                    } else {
                        console.log('✗ No QR code found in image');
                        showStatus(t('status_qr_not_found'), 'error');
                    }
                } catch (error) {
                    console.error('QR processing error:', error);
                    showStatus(t('status_error_general'), 'error');
                }
            };
            img.onerror = () => {
                console.error('Image load error');
                showStatus(t('status_error_general'), 'error');
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            console.error('File read error');
            showStatus(t('status_error_general'), 'error');
        };
        reader.readAsDataURL(file);
    }

    loadHistory();
    setupHistoryControls();

    // 打开历史记录页面
    document.getElementById('open-history-btn').addEventListener('click', () => {
        document.getElementById('history-page').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        const searchInput = document.getElementById('history-search-input');
        if (searchInput) {
            searchInput.focus();
        }
    });

    // 关闭历史记录页面
    document.getElementById('close-history-btn').addEventListener('click', () => {
        document.getElementById('history-page').style.display = 'none';
        document.body.style.overflow = '';
    });

    // 清除历史记录
    document.getElementById('clear-history-btn').addEventListener('click', () => {
        if (confirm(t('confirm_clear_history'))) {
            localStorage.removeItem('heightHistory');
            loadHistory();
        }
    });

    setupHeightChart();
    setupSettingsPanel();
});

// ==========================================
// SETTINGS PANEL FUNCTIONALITY
// ==========================================

function setupSettingsPanel() {
    const settingsPanel = document.getElementById('settings-panel');
    const settingsOverlay = document.getElementById('settings-overlay');
    const closeBtn = document.getElementById('settings-close-btn');

    // 关闭按钮
    closeBtn.addEventListener('click', closeSettingsPanel);
    settingsOverlay.addEventListener('click', closeSettingsPanel);

    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsPanel.classList.contains('active')) {
            closeSettingsPanel();
        }
    });

    // 导出数据
    document.getElementById('export-data-btn').addEventListener('click', () => {
        exportHistoryData();
    });

    // 导入数据
    document.getElementById('import-data-btn').addEventListener('click', () => {
        importHistoryData();
    });
}

function openSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    panel.classList.add('active');
}

function closeSettingsPanel() {
    document.getElementById('settings-panel').classList.remove('active');
}

// ==========================================
// 教程弹窗
// ==========================================

function openTutorial() {
    const modal = document.getElementById('tutorial-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeTutorial() {
    const modal = document.getElementById('tutorial-modal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

// 设置教程弹窗事件监听
document.addEventListener('DOMContentLoaded', () => {
    const closeTutorialBtn = document.getElementById('close-tutorial-btn');
    const tutorialOverlay = document.getElementById('tutorial-overlay');
    
    if (closeTutorialBtn) {
        closeTutorialBtn.addEventListener('click', closeTutorial);
    }
    
    if (tutorialOverlay) {
        tutorialOverlay.addEventListener('click', closeTutorial);
    }
});

function exportHistoryData() {
    const history = JSON.parse(localStorage.getItem('heightHistory') || '[]');
    
    if (history.length === 0) {
        showStatus(t('settings_no_data') || '没有数据可导出', 'error');
        return;
    }

    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sky-height-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showStatus(t('settings_export_success') || '数据已导出', 'success');
}

function importHistoryData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                
                if (!Array.isArray(importedData)) {
                    throw new Error('Invalid data format');
                }
                
                const currentHistory = JSON.parse(localStorage.getItem('heightHistory') || '[]');
                const merged = [...importedData, ...currentHistory];
                
                // 去重和排序
                const uniqueMap = new Map();
                merged.forEach(item => {
                    const key = `${item.timestamp}-${item.current}`;
                    if (!uniqueMap.has(key)) {
                        uniqueMap.set(key, item);
                    }
                });
                
                const finalData = Array.from(uniqueMap.values())
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 100);
                
                localStorage.setItem('heightHistory', JSON.stringify(finalData));
                loadHistory();
                
                showStatus(t('settings_import_success') || `导入成功，共 ${finalData.length} 条记录`, 'success');
            } catch (error) {
                showStatus(t('settings_import_error') || '导入失败，文件格式错误', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function displayResult(result) {
    document.getElementById('results').style.display = 'block';
    
    const currentEl = document.getElementById('current-height');
    const tallestEl = document.getElementById('tallest-height');
    const shortestEl = document.getElementById('shortest-height');
    const scaleEl = document.getElementById('scale-value');
    const heightEl = document.getElementById('height-value');

    animateValue(currentEl, 0, result.current, 500, 4);
    animateValue(tallestEl, 0, result.tallest, 500, 4);
    animateValue(shortestEl, 0, result.shortest, 500, 4);
    animateValue(scaleEl, 0, result.scale, 500, 10);
    
    // Display height_raw value
    if (result.json && result.json.height_raw !== undefined) {
        animateValue(heightEl, 0, result.json.height_raw, 500, 10);
    }
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = type === 'error' ? 'status-error' : 'status-success';
    setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = '';
    }, 3000);
}

function addToHistory(result) {
    let history = JSON.parse(localStorage.getItem('heightHistory') || '[]');
    history.unshift(result);
    if (history.length > 100) history = history.slice(0, 100); // 增加存储上限以支持图表
    localStorage.setItem('heightHistory', JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const rawHistory = JSON.parse(localStorage.getItem('heightHistory') || '[]');
    const historyList = document.getElementById('history-list');
    const emptyStateEl = document.getElementById('history-empty-state');
    const summaryTotalEl = document.getElementById('history-summary-total');
    const summaryShowingEl = document.getElementById('history-summary-showing');
    const summaryLastEl = document.getElementById('history-summary-last');
    const locale = currentLang === 'zh-Hans' ? 'zh-CN' : currentLang;

    if (summaryTotalEl) {
        summaryTotalEl.textContent = rawHistory.length;
    }

    if (summaryLastEl) {
        if (rawHistory.length > 0 && rawHistory[0].timestamp) {
            summaryLastEl.textContent = new Date(rawHistory[0].timestamp).toLocaleString(locale);
        } else {
            summaryLastEl.textContent = t('history_summary_none') || '--';
        }
    }

    const historyWithIndex = rawHistory.map((item, index) => ({ ...item, originalIndex: index }));
    let filteredHistory = historyWithIndex.slice();

    if (currentHistoryFilter === 'recent') {
        filteredHistory = filteredHistory.slice(0, HISTORY_RECENT_LIMIT);
    } else if (currentHistoryFilter === 'with-id') {
        filteredHistory = filteredHistory.filter(item => item.json && item.json.id);
    }

    if (historySearchTerm) {
        const term = historySearchTerm.toLowerCase();
        filteredHistory = filteredHistory.filter(item => {
            const idText = item.json && item.json.id ? String(item.json.id).toLowerCase() : '';
            const noteText = (item.note || '').toLowerCase();
            return idText.includes(term) || noteText.includes(term);
        });
    }

    if (summaryShowingEl) {
        summaryShowingEl.textContent = filteredHistory.length;
    }

    if (historyList) {
        historyList.innerHTML = '';
    }

    document.querySelectorAll('.history-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === currentHistoryFilter);
    });

    if (filteredHistory.length === 0) {
        if (historyList) {
            historyList.style.display = 'none';
        }
        if (emptyStateEl) {
            emptyStateEl.style.display = 'block';
        }
        return;
    }

    if (historyList) {
        historyList.style.display = 'block';
    }
    if (emptyStateEl) {
        emptyStateEl.style.display = 'none';
    }

    // 按ID分组
    const idGroups = {};
    const noIdItems = [];

    filteredHistory.forEach(item => {
        if (item.json && item.json.id) {
            const id = String(item.json.id);
            if (!idGroups[id]) {
                idGroups[id] = [];
            }
            idGroups[id].push(item);
        } else {
            noIdItems.push(item);
        }
    });

    Object.keys(idGroups).forEach(id => {
        const items = idGroups[id];
        const groupLi = document.createElement('li');
        groupLi.className = 'history-id-group';

        const groupHeader = document.createElement('div');
        groupHeader.className = 'id-group-header';

        const leftSection = document.createElement('div');
        leftSection.className = 'id-group-left';

        const toggleIcon = document.createElement('span');
        toggleIcon.className = 'toggle-icon';
        toggleIcon.innerHTML = '▼';

        const idLabel = document.createElement('span');
        idLabel.className = 'id-group-label';
        idLabel.textContent = `ID: ${id}`;

        const countBadge = document.createElement('span');
        countBadge.className = 'record-count-badge';
        countBadge.textContent = `${items.length} ${t('record_count') || '条记录'}`;

        leftSection.appendChild(toggleIcon);
        leftSection.appendChild(idLabel);
        leftSection.appendChild(countBadge);

        const statsSection = document.createElement('div');
        statsSection.className = 'id-group-stats';
        const heights = items.map(record => record.current);
        const maxHeight = Math.max(...heights).toFixed(4);
        const minHeight = Math.min(...heights).toFixed(4);
        statsSection.innerHTML = `
            <span>${t('result_tallest') || '最高'}: ${maxHeight}</span>
            <span>${t('result_shortest') || '最低'}: ${minHeight}</span>
        `;

        const chartBtn = document.createElement('button');
        chartBtn.className = 'id-group-chart-btn';
        chartBtn.title = t('history_view_chart');
        chartBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
        `;
        chartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showHeightChart(id);
        });

        groupHeader.appendChild(leftSection);
        groupHeader.appendChild(statsSection);
        groupHeader.appendChild(chartBtn);

        const recordsList = document.createElement('ul');
        recordsList.className = 'id-group-records';
        recordsList.style.display = 'none';

        items.forEach(item => {
            const recordLi = document.createElement('li');
            recordLi.className = 'id-record-item';
            recordLi.setAttribute('data-index', item.originalIndex);

            const recordMain = document.createElement('div');
            recordMain.className = 'record-main';

            const valueSpan = document.createElement('span');
            valueSpan.className = 'record-value';
            valueSpan.textContent = `${item.current.toFixed(4)}`;

            const timeSpan = document.createElement('span');
            timeSpan.className = 'record-time';
            timeSpan.textContent = new Date(item.timestamp).toLocaleString(locale);

            recordMain.appendChild(valueSpan);
            recordMain.appendChild(timeSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-record-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = t('delete_record') || '删除';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteHistoryItem(item.originalIndex);
            });

            recordLi.appendChild(recordMain);
            recordLi.appendChild(deleteBtn);

            recordLi.addEventListener('click', () => {
                displayResult(item);
                showStatus(t('status_loaded_from_history'), 'success');
            });

            recordsList.appendChild(recordLi);
        });

        groupHeader.addEventListener('click', () => {
            const isExpanded = recordsList.style.display !== 'none';
            recordsList.style.display = isExpanded ? 'none' : 'block';
            toggleIcon.innerHTML = isExpanded ? '▼' : '▲';
            groupLi.classList.toggle('expanded', !isExpanded);
        });

        groupLi.appendChild(groupHeader);
        groupLi.appendChild(recordsList);
        historyList.appendChild(groupLi);
    });

    if (noIdItems.length > 0) {
        const noIdGroup = document.createElement('li');
        noIdGroup.className = 'history-id-group no-id-group';

        const noIdHeader = document.createElement('div');
        noIdHeader.className = 'id-group-header';
        noIdHeader.innerHTML = `
            <div class="id-group-left">
                <span class="toggle-icon">▼</span>
                <span class="id-group-label">${t('no_id_records') || '无ID记录'}</span>
                <span class="record-count-badge">${noIdItems.length} ${t('record_count') || '条记录'}</span>
            </div>
        `;

        const noIdRecordsList = document.createElement('ul');
        noIdRecordsList.className = 'id-group-records';
        noIdRecordsList.style.display = 'none';

        noIdItems.forEach(item => {
            const recordLi = document.createElement('li');
            recordLi.className = 'id-record-item';
            recordLi.setAttribute('data-index', item.originalIndex);

            const recordMain = document.createElement('div');
            recordMain.className = 'record-main';

            const valueSpan = document.createElement('span');
            valueSpan.className = 'record-value';
            valueSpan.textContent = `${item.current.toFixed(4)}`;

            const timeSpan = document.createElement('span');
            timeSpan.className = 'record-time';
            timeSpan.textContent = new Date(item.timestamp).toLocaleString(locale);

            recordMain.appendChild(valueSpan);
            recordMain.appendChild(timeSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-record-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteHistoryItem(item.originalIndex);
            });

            recordLi.appendChild(recordMain);
            recordLi.appendChild(deleteBtn);

            recordLi.addEventListener('click', () => {
                displayResult(item);
                showStatus(t('status_loaded_from_history'), 'success');
            });

            noIdRecordsList.appendChild(recordLi);
        });

        noIdHeader.addEventListener('click', () => {
            const isExpanded = noIdRecordsList.style.display !== 'none';
            noIdRecordsList.style.display = isExpanded ? 'none' : 'block';
            noIdHeader.querySelector('.toggle-icon').innerHTML = isExpanded ? '▼' : '▲';
            noIdGroup.classList.toggle('expanded', !isExpanded);
        });

        noIdGroup.appendChild(noIdHeader);
        noIdGroup.appendChild(noIdRecordsList);
        historyList.appendChild(noIdGroup);
    }
}

function setupHistoryControls() {
    const filterButtons = document.querySelectorAll('.history-filter-btn');
    const searchInput = document.getElementById('history-search-input');
    const clearBtn = document.getElementById('history-search-clear');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            if (!filter || filter === currentHistoryFilter) {
                return;
            }
            currentHistoryFilter = filter;
            filterButtons.forEach(b => b.classList.toggle('active', b === btn));
            loadHistory();
        });
    });

    if (searchInput) {
        searchInput.value = historySearchTerm;
        searchInput.addEventListener('input', (e) => {
            historySearchTerm = e.target.value.trim();
            loadHistory();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (!historySearchTerm) {
                return;
            }
            historySearchTerm = '';
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            loadHistory();
        });
    }
}

function deleteHistoryItem(index) {
    let history = JSON.parse(localStorage.getItem('heightHistory') || '[]');
    history.splice(index, 1);
    localStorage.setItem('heightHistory', JSON.stringify(history));
    
    // 找到要删除的记录元素
    const recordElement = document.querySelector(`.id-record-item[data-index="${index}"]`);
    if (!recordElement) {
        // 如果找不到元素，回退到重新加载
        loadHistory();
        return;
    }
    
    // 找到父ID组
    const idGroup = recordElement.closest('.history-id-group');
    const recordsList = recordElement.closest('.id-group-records');
    
    // 删除记录元素
    recordElement.remove();
    
    // 更新所有索引大于被删除索引的记录的 data-index 属性
    document.querySelectorAll('.id-record-item').forEach(item => {
        const itemIndex = parseInt(item.getAttribute('data-index'));
        if (itemIndex > index) {
            item.setAttribute('data-index', itemIndex - 1);
        }
    });
    
    // 检查该ID组是否还有其他记录
    const remainingRecords = recordsList ? recordsList.querySelectorAll('.id-record-item') : [];
    
    if (remainingRecords.length === 0 && idGroup) {
        // 如果该ID组没有记录了，删除整个组
        idGroup.remove();
    } else {
        // 更新该ID组的记录计数
        const countBadge = idGroup ? idGroup.querySelector('.record-count-badge') : null;
        if (countBadge) {
            countBadge.textContent = `${remainingRecords.length} ${t('record_count') || '条记录'}`;
        }
    }
    
    // 更新摘要统计
    const summaryTotalEl = document.getElementById('history-summary-total');
    const summaryShowingEl = document.getElementById('history-summary-showing');
    const summaryLastEl = document.getElementById('history-summary-last');
    const locale = currentLang === 'zh-Hans' ? 'zh-CN' : currentLang;
    
    if (summaryTotalEl) {
        summaryTotalEl.textContent = history.length;
    }
    if (summaryShowingEl) {
        const currentShowing = parseInt(summaryShowingEl.textContent) || 0;
        summaryShowingEl.textContent = Math.max(0, currentShowing - 1);
    }
    if (summaryLastEl) {
        if (history.length > 0 && history[0].timestamp) {
            summaryLastEl.textContent = new Date(history[0].timestamp).toLocaleString(locale);
        } else {
            summaryLastEl.textContent = t('history_summary_none') || '--';
        }
    }
    
    // 如果历史记录为空，显示空状态
    if (history.length === 0) {
        const historyList = document.getElementById('history-list');
        const emptyStateEl = document.getElementById('history-empty-state');
        if (historyList) historyList.style.display = 'none';
        if (emptyStateEl) emptyStateEl.style.display = 'block';
    }
}

// ==========================================
// HEIGHT TREND CHART FUNCTIONALITY
// ==========================================

let heightChart = null;
let currentChartFilter = 'all';

function setupHeightChart() {
    const closeBtn = document.getElementById('close-chart-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('chart-page').style.display = 'none';
        });
    }

    // 设置筛选按钮
    document.querySelectorAll('.chart-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.chart-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentChartFilter = btn.getAttribute('data-filter');
            
            // 重新加载当前显示的图表
            const chartIdDisplay = document.getElementById('chart-id-display');
            if (chartIdDisplay && chartIdDisplay.dataset.currentId) {
                showHeightChart(chartIdDisplay.dataset.currentId);
            }
        });
    });
}

function showHeightChart(targetId) {
    const history = JSON.parse(localStorage.getItem('heightHistory') || '[]');
    
    // 筛选出相同ID的记录
    const sameIdRecords = history.filter(item => 
        item.json && item.json.id && item.json.id.toString() === targetId.toString()
    ).reverse(); // 反转以按时间正序排列

    if (sameIdRecords.length === 0) {
        showStatus(t('chart_no_data'), 'error');
        return;
    }

    // 应用筛选器
    let filteredRecords = sameIdRecords;
    if (currentChartFilter === 'recent') {
        filteredRecords = sameIdRecords.slice(-10);
    }

    // 显示图表页面
    const chartPage = document.getElementById('chart-page');
    chartPage.style.display = 'block';

    // 更新标题
    const chartIdDisplay = document.getElementById('chart-id-display');
    chartIdDisplay.textContent = `ID: ${targetId} (${sameIdRecords.length} ${t('chart_stat_count')})`;
    chartIdDisplay.dataset.currentId = targetId;

    // 计算统计数据
    const currentHeights = filteredRecords.map(r => r.current);
    const avgHeight = currentHeights.reduce((a, b) => a + b, 0) / currentHeights.length;
    const minHeight = Math.min(...currentHeights);
    const maxHeight = Math.max(...currentHeights);
    const range = maxHeight - minHeight;

    // 更新统计显示
    document.getElementById('chart-stat-count').textContent = filteredRecords.length;
    document.getElementById('chart-stat-avg').textContent = avgHeight.toFixed(4);
    document.getElementById('chart-stat-range').textContent = range.toFixed(4);

    // 准备图表数据
    const labels = filteredRecords.map((item, index) => {
        const date = new Date(item.timestamp);
        return date.toLocaleString(currentLang === 'zh-Hans' ? 'zh-CN' : currentLang, {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    });

    const currentData = filteredRecords.map(r => r.current);
    const tallestData = filteredRecords.map(r => r.tallest);
    const shortestData = filteredRecords.map(r => r.shortest);

    // 销毁旧图表
    if (heightChart) {
        heightChart.destroy();
    }

    // 创建新图表
    const ctx = document.getElementById('height-chart');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)';
    const textColor = isDark ? '#e2e8f0' : '#1f2937';

    heightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: t('chart_legend_current'),
                    data: currentData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: t('chart_legend_tallest'),
                    data: tallestData,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.05)',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#2ecc71',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    tension: 0.4,
                    borderDash: [5, 5],
                    fill: false
                },
                {
                    label: t('chart_legend_shortest'),
                    data: shortestData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.05)',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#e74c3c',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    tension: 0.4,
                    borderDash: [5, 5],
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: false // 使用自定义图例
                },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(42, 42, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: gridColor,
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed.y.toFixed(4);
                            return label;
                        },
                        afterBody: function(context) {
                            const index = context[0].dataIndex;
                            const record = filteredRecords[index];
                            if (record.json) {
                                const details = [];
                                if (record.json.height_raw !== undefined) {
                                    details.push(`Height Raw: ${record.json.height_raw.toFixed(4)}`);
                                }
                                if (record.json.scale_raw !== undefined) {
                                    details.push(`Scale Raw: ${record.json.scale_raw.toFixed(10)}`);
                                }
                                return details;
                            }
                            return [];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: -1,
                    max: 15,
                    ticks: {
                        stepSize: 1,
                        color: textColor,
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return value.toFixed(1);
                        }
                    },
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: t('result_current'),
                        color: textColor,
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    ticks: {
                        color: textColor,
                        font: {
                            size: 10
                        },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    }
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        }
    });

    // 添加参考线（游戏内正常身高范围 0-14）
    if (heightChart.options.plugins) {
        heightChart.options.plugins.annotation = {
            annotations: {
                line1: {
                    type: 'line',
                    yMin: 0,
                    yMax: 0,
                    borderColor: 'rgba(255, 193, 7, 0.5)',
                    borderWidth: 1,
                    borderDash: [3, 3]
                },
                line2: {
                    type: 'line',
                    yMin: 14,
                    yMax: 14,
                    borderColor: 'rgba(255, 193, 7, 0.5)',
                    borderWidth: 1,
                    borderDash: [3, 3]
                }
            }
        };
    }
}
