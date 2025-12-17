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
        
        // 这里将调用
