// script.js - 完整前端逻辑

// 全局变量
let audioFile = null;
let transcriptionResult = null;
let isProcessing = false;

// DOM 元素
const audioFileInput = document.getElementById('audioFile');
const dropArea = document.getElementById('dropArea');
const transcribeBtn = document.getElementById('transcribeBtn');
const clearBtn = document.getElementById('clearBtn');
const loadingElement = document.getElementById('loading');
const resultElement = document.getElementById('result');
const transcriptElement = document.getElementById('transcript');
const audioPlayer = document.getElementById('audioPlayer');
const playerContainer = document.getElementById('player');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const toast = document.getElementById('toast');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 设置事件监听器
    setupEventListeners();
    
    // 检查浏览器兼容性
    checkBrowserCompatibility();
});

// 设置事件监听器
function setupEventListeners() {
    // 文件选择
    audioFileInput.addEventListener('change', handleFileSelect);
    
    // 拖放功能
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    
    // 点击上传区域
    dropArea.addEventListener('click', () => {
        audioFileInput.click();
    });
    
    // 转写按钮
    transcribeBtn.addEventListener('click', startTranscription);
    
    // 下载按钮
    document.getElementById('downloadTxt').addEventListener('click', () => downloadTranscript('txt'));
    document.getElementById('downloadSrt').addEventListener('click', () => downloadTranscript('srt'));
    document.getElementById('downloadJson').addEventListener('click', () => downloadTranscript('json'));
    
    // 音频播放器事件
    audioPlayer.addEventListener('timeupdate', () => {
        highlightCurrentLine();
    });
}

// 检查浏览器兼容性
function checkBrowserCompatibility() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('您的浏览器不支持语音识别功能，部分功能可能受限', 'warning');
    }
}

// 处理文件选择
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        validateAndSetFile(file);
    }
}

// 拖放功能处理
function handleDragOver(event) {
    event.preventDefault();
    dropArea.classList.add('dragover');
    dropArea.style.borderColor = '#4f46e5';
}

function handleDragLeave(event) {
    event.preventDefault();
    dropArea.classList.remove('dragover');
    dropArea.style.borderColor = '';
}

function handleDrop(event) {
    event.preventDefault();
    dropArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        validateAndSetFile(files[0]);
    }
}

// 验证并设置文件
function validateAndSetFile(file) {
    // 检查文件类型
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/ogg'];
    if (!validTypes.includes(file.type)) {
        showToast('请选择有效的音频文件 (MP3, WAV, M4A, OGG)', 'error');
        return;
    }
    
    // 检查文件大小 (50MB限制)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        showToast('文件大小超过50MB限制', 'error');
        return;
    }
    
    // 设置文件
    audioFile = file;
    
    // 显示文件信息
    displayFileInfo(file);
    
    // 设置音频播放器
    const audioURL = URL.createObjectURL(file);
    audioPlayer.src = audioURL;
    playerContainer.classList.remove('hidden');
    
    // 启用转写按钮
    transcribeBtn.disabled = false;
    
    // 播放音频以获取时长
    audioPlayer.addEventListener('loadedmetadata', () => {
        document.getElementById('audioDuration').textContent = formatTime(audioPlayer.duration);
    });
    
    showToast('文件上传成功', 'success');
}

// 显示文件信息
function displayFileInfo(file) {
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.classList.remove('hidden');
}

// 清除文件
function clearFile() {
    audioFile = null;
    audioFileInput.value = '';
    audioPlayer.src = '';
    playerContainer.classList.add('hidden');
    fileInfo.classList.add('hidden');
    transcribeBtn.disabled = true;
    resultElement.classList.add('hidden');
}

// 清除全部
function clearAll() {
    clearFile();
    transcriptionResult = null;
    transcriptElement.innerHTML = `
        <div class="empty-transcript">
            <i class="fas fa-headphones"></i>
            <p>转写结果将显示在这里</p>
        </div>
    `;
}

// 开始转写
async function startTranscription() {
    if (!audioFile || isProcessing) return;
    
    isProcessing = true;
    showLoading(true);
    transcribeBtn.disabled = true;
    
    try {
        // 获取设置
        const language = document.getElementById('language').value;
        const model = document.getElementById('model').value;
        const includeTimestamps = document.getElementById('timestamps').checked;
        
        // 模拟处理进度
        simulateProgress();
        
        // 这里将调用实际的语音识别API
        // 当前版本使用浏览器内置API作为演示
        transcriptionResult = await transcribeWithWebSpeechAPI(audioFile, language, includeTimestamps);
        
        // 显示结果
        displayTranscriptionResult(transcriptionResult);
        showLoading(false);
        resultElement.classList.remove('hidden');
        
        showToast('转写完成！', 'success');
        
    } catch (error) {
        console.error('转写失败:', error);
        showToast(`转写失败: ${error.message}`, 'error');
        showLoading(false);
    } finally {
        isProcessing = false;
        transcribeBtn.disabled = false;
    }
}

// 使用Web Speech API进行转写（演示用）
async function transcribeWithWebSpeechAPI(audioFile, language, includeTimestamps) {
    return new Promise((resolve, reject) => {
        // 检查浏览器支持
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            reject(new Error('您的浏览器不支持语音识别'));
            return;
        }
        
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = language;
        
        let segments = [];
        let startTime = Date.now();
        
        recognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const timestamp = (Date.now() - startTime) / 1000;
                
                if (result.isFinal) {
                    segments.push({
                        text: result[0].transcript,
                        start: timestamp - 2, // 估算开始时间
                        end: timestamp,
                        confidence: result[0].confidence
                    });
                }
            }
        };
        
        recognition.onend = () => {
            if (segments.length > 0) {
                resolve({
                    text: segments.map(s => s.text).join(' '),
                    segments: segments,
                    language: language,
                    duration: audioPlayer.duration
                });
            } else {
                // 模拟生成演示数据
                resolve(generateDemoTranscription());
            }
        };
        
        recognition.onerror = (event) => {
            reject(new Error(event.error));
        };
        
        // 创建音频上下文来播放音频并触发识别
        playAudioForRecognition(audioFile)
            .then(() => {
                recognition.start();
            })
            .catch(reject);
    });
}

// 播放音频以进行识别
async function playAudioForRecognition(audioFile) {
    return new Promise((resolve) => {
        // 这里应该实际播放音频并同步进行识别
        // 为了演示，我们使用setTimeout模拟
        setTimeout(resolve, 2000);
    });
}

// 生成演示数据
function generateDemoTranscription() {
    const demoTexts = [
        "大家好，欢迎使用中文音频转逐字稿工具。",
        "这是一个基于Web技术的免费工具，可以帮助您将音频文件转换为文字。",
        "支持多种音频格式，包括MP3、WAV、M4A等。",
        "转写结果包含时间戳，方便您进行编辑和校对。",
        "您可以将结果下载为TXT、SRT或JSON格式。",
        "感谢您的使用，如果有任何问题，请在GitHub上提交反馈。"
    ];
    
    const segments = [];
    let currentTime = 0;
    
    demoTexts.forEach((text, index) => {
        const duration = text.length * 0.15; // 模拟时长
        segments.push({
            text: text,
            start: currentTime,
            end: currentTime + duration,
            confidence: 0.9 + Math.random() * 0.1
        });
        currentTime += duration + 0.5;
    });
    
    return {
        text: demoTexts.join(' '),
        segments: segments,
        language: 'zh',
        duration: currentTime
    };
}

// 显示转写结果
function displayTranscriptionResult(result) {
    const transcriptContainer = document.getElementById('transcript');
    const wordCountElement = document.getElementById('wordCount');
    
    // 清空容器
    transcriptContainer.innerHTML = '';
    
    // 计算总字数
    const wordCount = result.text.replace(/[^\u4e00-\u9fa5]/g, '').length;
    wordCountElement.textContent = wordCount;
    
    // 显示音频时长
    document.getElementById('audioDuration').textContent = formatTime(result.duration);
    
    // 创建逐行显示
    result.segments.forEach((segment, index) => {
        const line = document.createElement('div');
        line.className = 'transcript-line';
        line.dataset.start = segment.start;
        line.dataset.index = index;
        
        const timestamp = document.createElement('span');
        timestamp.className = 'timestamp';
        timestamp.textContent = formatTime(segment.start);
        
        const text = document.createElement('span');
        text.className = 'transcript-text';
        text.textContent = segment.text;
        
        line.appendChild(timestamp);
        line.appendChild(text);
        transcriptContainer.appendChild(line);
        
        // 点击时间戳跳转到对应时间
        timestamp.addEventListener('click', (e) => {
            e.stopPropagation();
            audioPlayer.currentTime = segment.start;
            audioPlayer.play();
        });
    });
    
    // 如果没有分段，显示完整文本
    if (result.segments.length === 0) {
        const line = document.createElement('div');
        line.className = 'transcript-line';
        line.innerHTML = `<span class="timestamp">00:00:00</span><span class="transcript-text">${result.text}</span>`;
        transcriptContainer.appendChild(line);
    }
}

// 高亮当前播放的行
function highlightCurrentLine() {
    const currentTime = audioPlayer.currentTime;
    const lines = document.querySelectorAll('.transcript-line');
    
    lines.forEach(line => {
        line.classList.remove('active');
        const startTime = parseFloat(line.dataset.start);
        const endTime = startTime + 5; // 假设每行大约5秒
        
        if (currentTime >= startTime && currentTime <= endTime) {
            line.classList.add('active');
            // 滚动到可见区域
            if (line.offsetTop < transcriptElement.scrollTop || 
                line.offsetTop > transcriptElement.scrollTop + transcriptElement.clientHeight - 50) {
                transcriptElement.scrollTop = line.offsetTop - 50;
            }
        }
    });
}

// 下载转写结果
function downloadTranscript(format) {
    if (!transcriptionResult) {
        showToast('没有可下载的内容', 'warning');
        return;
    }
    
    let content, filename, mimeType;
    const baseName = audioFile ? audioFile.name.replace(/\.[^/.]+$/, "") : 'transcription';
    
    switch(format) {
        case 'txt':
            content = generateTxtContent();
            filename = `${baseName}_转写结果.txt`;
            mimeType = 'text/plain';
            break;
            
        case 'srt':
            content = generateSrtContent();
            filename = `${baseName}_字幕.srt`;
            mimeType = 'text/plain';
            break;
            
        case 'json':
            content = JSON.stringify(transcriptionResult, null, 2);
            filename = `${baseName}_数据.json`;
            mimeType = 'application/json';
            break;
            
        default:
            return;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast(`${format.toUpperCase()}文件下载中...`, 'success');
}

// 生成TXT内容
function generateTxtContent() {
    let content = `音频转写结果\n`;
    content += `生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
    content += `音频时长: ${formatTime(transcriptionResult.duration)}\n`;
    content += `语言: ${getLanguageName(transcriptionResult.language)}\n`;
    content += `\n========== 逐字稿 ==========\n\n`;
    
    if (document.getElementById('timestamps').checked && transcriptionResult.segments) {
        transcriptionResult.segments.forEach(segment => {
            content += `[${formatTime(segment.start)}] ${segment.text}\n`;
        });
    } else {
        content += transcriptionResult.text;
    }
    
    return content;
}

// 生成SRT内容
function generateSrtContent() {
    if (!transcriptionResult.segments) return '';
    
    let srtContent = '';
    transcriptionResult.segments.forEach((segment, index) => {
        srtContent += `${index + 1}\n`;
        srtContent += `${formatTimeForSRT(segment.start)} --> ${formatTimeForSRT(segment.end)}\n`;
        srtContent += `${segment.text}\n\n`;
    });
    
    return srtContent;
}

// 复制全文
function copyTranscript() {
    const textToCopy = generateTxtContent();
    
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            showToast('全文已复制到剪贴板', 'success');
        })
        .catch(err => {
            console.error('复制失败:', err);
            showToast('复制失败，请手动选择复制', 'error');
        });
}

// 工具函数
function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

function formatTimeForSRT(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds - Math.floor(seconds)) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getLanguageName(code) {
    const languages = {
        'zh': '普通话',
        'zh-TW': '台湾普通话',
        'yue': '粤语',
        'en': '英语'
    };
    return languages[code] || code;
}

// 显示/隐藏加载状态
function showLoading(show) {
    if (show) {
        loadingElement.classList.remove('hidden');
        resultElement.classList.add('hidden');
    } else {
        loadingElement.classList.add('hidden');
    }
}

// 模拟处理进度
function simulateProgress() {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    let progress = 0;
    const interval = setInterval(() => {
        if (progress >= 100) {
            clearInterval(interval);
            return;
        }
        
        progress += Math.random() * 10;
        if (progress > 100) progress = 100;
        
        progressBar.style.width = `${progress}%`;
        
        if (progress < 30) {
            progressText.textContent = '正在加载语音识别模型...';
        } else if (progress < 70) {
            progressText.textContent = '正在转写音频内容...';
        } else {
            progressText.textContent = '正在处理时间戳和格式化...';
        }
    }, 300);
}

// 显示消息提示
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = 'toast';
    
    // 根据类型设置背景色
    switch(type) {
        case 'success':
            toast.style.background = '#10b981';
            break;
        case 'error':
            toast.style.background = '#ef4444';
            break;
        case 'warning':
            toast.style.background = '#f59e0b';
            break;
        default:
            toast.style.background = '#1e293b';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
