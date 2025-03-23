// 配置
const TOTAL_ROUNDS = 1;
let words = [
    'once','upon','time','bear','long','thick','tail','other','animal','trip','over','walk',
'tickle','nose','sleep','little','would','even','ride','fair','better','than','mine',
'thought','fox','decide','trick','him','creep','take','few','carry','lake','smell',
'them','came','closer','those','look','said','say','show','how','catch','told','tell',
'bite','pull','wait','become','grew','grow','cold','begin','began','snow','next','still',
'shout','huge','heap','jump','frozen','freeze','break','broke','sorry','cry','happen',
'new','short','smile','pad','hear','cause','grief','human','dear','could','never','keep',
'mill','hill','work','hard','sack','after','bad','back','think','sell','sale','ill',
'move','shock','hut','rock','relief','know','knife'
];
let people_descriptions = [
    {
        "name": "張郃",
        "sub_name": "[儁乂]",
        "brief": "魏國武將。原為袁紹部下。",
        "story": "於官渡之戰時加入袁紹軍隊。於烏巢遭曹操突襲時，採納郭圖之策，與高覽共同進攻曹操之本營卻敗退。因遭郭圖轉嫁戰敗之責，不得已向曹操投降。爾後成為魏將轉戰各地。於進攻漢中張魯時與夏侯淵一同擔任先鋒。與劉備之漢中攻防戰慘敗於張飛，險遭曹洪斬首。諸葛亮發起北伐時，雖於街亭擊破馬謖，讓蜀軍大吃苦頭，卻於第四回北伐時陣亡於木門道。",
        "history": "黃巾之亂時，於韓馥之指揮下進行鎮壓。"
    }
]
let currentWord = '';
let testedWords = new Set();
let currentResults = [];
let audioUrls = {};

// 音效
const CHEER_SOUND = new Audio('https://assets.mixkit.co/active_storage/sfx/2993/2993-preview.mp3');
const SIGH_SOUND = new Audio('https://assets.mixkit.co/active_storage/sfx/473/473-preview.mp3');

// 从localStorage加载词库
if (localStorage.getItem('wordList')) {
    words = JSON.parse(localStorage.getItem('wordList'));
}

// 百度翻译 API 配置
const BAIDU_APP_ID = '20250317002306712';
const BAIDU_KEY = '1Ho7cPXr1mqvprhLpGnP';


// 更新 fetchWordMeaning 方法
async function fetchWordMeaning(word) {
    try {
        const youdao = await fetch(`http://192.168.1.4:3000/phonetic?word=${encodeURIComponent(word)}`)
        const youdaoData = await youdao.json();
        
        // 使用 mp3 格式的音频，对移动设备更友好
        return { 
            meaning: `[${youdaoData.phonetic}]\n${youdaoData.translation}`,
            audioUrl: `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`
        };
    } catch (error) {
        console.error('获取释义失败:', error);
        return { 
            meaning: '获取释义失败', 
            // 即使获取释义失败，也提供音频 URL
            audioUrl: `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`
        };
    }
}

function playWordSound(audioUrl) {
    if (!audioUrl) return;
    
    // 预加载音频
    const audio = new Audio();
    
    // 添加事件监听器
    audio.addEventListener('canplaythrough', () => {
        // 在 iOS 上需要用户交互才能播放
        audio.play().catch(error => {
            console.error('播放音频失败:', error);
        });
    });
    
    // 设置音频源
    audio.src = audioUrl;
}

// 音频播放
function playWordSound(audioUrl) {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.play().catch(error => console.error('播放音频失败:', error));
}

// 动画效果
function createFireworks() {
    const firework = document.createElement('canvas');
    firework.className = 'success-firework';
    document.body.appendChild(firework);
    
    const ctx = firework.getContext('2d');
    firework.width = window.innerWidth;
    firework.height = window.innerHeight;
    
    let particles = [];
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
        });
    }
    
    function animate() {
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0, 0, firework.width, firework.height);
        
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        if (particles[0].y < window.innerHeight) {
            requestAnimationFrame(animate);
        } else {
            document.body.removeChild(firework);
        }
    }
    
    animate();
}

// 拖拽相关
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.textContent);
    e.target.style.opacity = '0.4';
    e.dataTransfer.setData('sourceParent', e.target.parentNode.className);
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const letter = e.dataTransfer.getData('text/plain');
    const sourceParent = e.dataTransfer.getData('sourceParent');
    const draggedElement = document.querySelector('.letter[style*="opacity"]');
    const lettersContainer = document.getElementById('letters-container');
    
    let targetElement = e.target;
    if (e.target.className === 'letter') {
        targetElement = e.target.parentNode;
    }
    
    if (targetElement.className === 'slot') {
        if (targetElement.hasChildNodes()) {
            const existingLetter = targetElement.firstChild;
            if (sourceParent === 'slot') {
                draggedElement.parentNode.appendChild(existingLetter);
            } else {
                lettersContainer.appendChild(existingLetter);
            }
        }
        
        targetElement.appendChild(draggedElement);
        draggedElement.style.opacity = '1';
        checkWord();
    } else if (targetElement.id === 'letters-container' && sourceParent === 'slot') {
        draggedElement.style.opacity = '1';
        targetElement.appendChild(draggedElement);
    }
}

function handleLetterClick(e) {
    const letter = e.target;
    const lettersContainer = document.getElementById('letters-container');
    const slots = document.querySelectorAll('.slot');
    
    if (letter.parentNode.className === 'slot') {
        lettersContainer.appendChild(letter);
    } else if (letter.parentNode.id === 'letters-container') {
        for (let slot of slots) {
            if (!slot.hasChildNodes()) {
                slot.appendChild(letter);
                checkWord();
                break;
            }
        }
    }
}

// 游戏核心逻辑
function shuffleWord(word) {
    let array = word.split('');
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function checkWord() {
    const slots = document.querySelectorAll('.slot');
    let filledSlots = 0;
    let userWord = '';
    
    slots.forEach(slot => {
        if (slot.hasChildNodes()) {
            filledSlots++;
            userWord += slot.firstChild.textContent;
        }
    });
    
    if (filledSlots === currentWord.length) {
        if (userWord === currentWord) {
            showResult(true, '恭喜你！拼写正确！');
        } else {
            showResult(false, '很遗憾，拼写错误。\n正确答案是：' + currentWord);
        }
    }
}

function showResult(success, message) {
    const resultMessage = document.getElementById('result-message');
    const overlay = document.getElementById('failure-overlay');
    
    // 播放音效
    if (success) {
        CHEER_SOUND.currentTime = 0;
        CHEER_SOUND.play().catch(error => console.error('播放音效失败:', error));
    } else {
        SIGH_SOUND.currentTime = 0;
        SIGH_SOUND.play().catch(error => console.error('播放音效失败:', error));
    }
    
    // 重置状态
    resultMessage.style.display = 'none';
    resultMessage.style.opacity = '0';
    overlay.style.backgroundColor = 'rgba(0,0,0,0)';
    overlay.style.display = 'none';
    
    // 强制重绘
    resultMessage.offsetHeight;
    overlay.offsetHeight;
    
    // 短暂延迟后显示新消息
    setTimeout(() => {
        overlay.style.display = 'block';
        resultMessage.style.display = 'block';
        resultMessage.innerHTML = message;
        
        currentResults.push({
            word: currentWord,
            success: success,
            audioUrl: audioUrls[currentWord]
        });
        
        if (!success) {
            resultMessage.innerHTML += '<button class="confirm-button" onclick="handleConfirm()">知道了</button>';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        }
        
        resultMessage.className = `result-message ${success ? 'success-message' : 'failure-message'}`;
        resultMessage.style.opacity = '1';
        
        if (success) {
            createFireworks();
            setTimeout(() => {
                resultMessage.style.opacity = '0';
                overlay.style.backgroundColor = 'rgba(0,0,0,0)';
                setTimeout(() => {
                    resultMessage.style.display = 'none';
                    overlay.style.display = 'none';
                    if (testedWords.size < TOTAL_ROUNDS) {
                        createGame().catch(error => console.error('创建新游戏失败:', error));
                    } else {
                        showFinalResults();
                    }
                }, 500);
            }, 2000);
        }
    }, 100);
}

function handleConfirm() {
    const resultMessage = document.getElementById('result-message');
    const overlay = document.getElementById('failure-overlay');
    
    resultMessage.style.opacity = '0';
    overlay.style.backgroundColor = 'rgba(0,0,0,0)';
    
    setTimeout(() => {
        resultMessage.style.display = 'none';
        overlay.style.display = 'none';
        
        if (testedWords.size < TOTAL_ROUNDS) {
            createGame().catch(error => console.error('创建新游戏失败:', error));
        } else {
            showFinalResults();
        }
    }, 300);
}

function giveUp() {
    // 获取按钮元素
    const giveUpBtn = document.getElementById('give-up-btn');
    
    // 获取可视区域的尺寸
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 按钮的尺寸
    const btnRect = giveUpBtn.getBoundingClientRect();
    
    // 随机生成新位置（保持在可视区域内）
    const newX = Math.random() * (viewportWidth - btnRect.width);
    const newY = Math.random() * (viewportHeight - btnRect.height);
    
    // 设置新位置
    giveUpBtn.style.position = 'fixed';
    giveUpBtn.style.left = `${newX}px`;
    giveUpBtn.style.top = `${newY}px`;
    
    // // 原有的放弃逻辑
    // const lettersContainer = document.getElementById('letters-container');
    // const slots = document.querySelectorAll('.slot');
    
    // slots.forEach(slot => {
    //     if (slot.hasChildNodes()) {
    //         lettersContainer.appendChild(slot.firstChild);
    //     }
    // });
    
    // currentWord.split('').forEach((letter, index) => {
    //     const letterDiv = document.createElement('div');
    //     letterDiv.className = 'letter';
    //     letterDiv.textContent = letter;
    //     letterDiv.draggable = true;
    //     letterDiv.addEventListener('dragstart', handleDragStart);
    //     slots[index].appendChild(letterDiv);
    // });
    
    // showResult(false, '很遗憾，正确答案是：' + currentWord);
}

async function createGame() {
    if (testedWords.size >= TOTAL_ROUNDS) {
        showFinalResults();
        return;
    }

    const availableWords = words.filter(word => !testedWords.has(word));
    if (availableWords.length === 0) {
        showFinalResults();
        return;
    }

    currentWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    testedWords.add(currentWord);
    const shuffledLetters = shuffleWord(currentWord);
    
    const wordHint = document.getElementById('word-hint');
    wordHint.textContent = '正在加载释义...';
    
    const { meaning, audioUrl } = await fetchWordMeaning(currentWord);
    if (audioUrl) {
        audioUrls[currentWord] = audioUrl;
    }
    
    wordHint.innerHTML = `
        <div style="text-align: center; max-width: 75%; margin: 0 auto;">
            <div style="margin-bottom: 10px; color: #666;">第 ${testedWords.size} / ${TOTAL_ROUNDS} 轮</div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <span style="word-break: break-all;">提示：${meaning}</span>
                ${audioUrl ? `<button class="play-sound-btn" onclick="playWordSound('${audioUrl}')">🔊</button>` : ''}
            </div>
        </div>
    `;
    
    const lettersContainer = document.getElementById('letters-container');
    const slotsContainer = document.getElementById('slots-container');
    
    lettersContainer.innerHTML = '';
    slotsContainer.innerHTML = '';
    
    shuffledLetters.forEach((letter, index) => {
        const letterDiv = document.createElement('div');
        letterDiv.className = 'letter';
        letterDiv.textContent = letter;
        letterDiv.draggable = true;
        letterDiv.addEventListener('dragstart', handleDragStart);
        letterDiv.addEventListener('click', handleLetterClick);
        lettersContainer.appendChild(letterDiv);
        
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('drop', handleDrop);
        slotsContainer.appendChild(slot);
    });
    
    // 在 createGame 函数中添加按钮样式重置
    const giveUpBtn = document.getElementById('give-up-btn');
    giveUpBtn.style.position = 'static';  // 重置按钮位置
    
}

// 在showFinalResults函数中添加判断逻辑
function showFinalResults() {
    const gameContainer = document.getElementById('game-container');
    const allWords = Array.from(testedWords);
    
    gameContainer.innerHTML = `
        <div style="max-width: 800px; margin: 20px auto; padding: 20px;">
            <h2 style="text-align: center; margin-bottom: 20px;">测试结果</h2>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                ${allWords.map(word => {
                    const result = currentResults.find(r => r.word === word);
                    return `
                        <div class="word-item" style="
                            padding: 10px;
                            border-radius: 5px;
                            text-align: center;
                            cursor: pointer;
                            background-color: ${result?.success ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'};
                            color: ${result?.success ? '#2e7d32' : '#d32f2f'};
                        " onclick="playWordSound('${result?.audioUrl || ''}')">
                            ${word}
                        </div>
                    `;
                }).join('')}
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <p>总计: ${allWords.length} 个单词</p>
                <p>正确: ${currentResults.filter(r => r.success).length} 个</p>
                <p>错误: ${currentResults.filter(r => !r.success).length} 个</p>
            </div>
            <button onclick="restartGame()" style="
                display: block;
                margin: 20px auto;
                padding: 10px 20px;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            ">重新开始</button>
        </div>
    `;
    
    // 添加全对判断
    const allCorrect = currentResults.every(r => r.success) && currentResults.length === TOTAL_ROUNDS;
    
    if (allCorrect) {
        showCelebration();
    }
}

function restartGame() {
    testedWords.clear();
    currentResults = [];
    audioUrls = {};
    const gameContainer = document.getElementById('game-container');
    gameContainer.innerHTML = `
        <div id="word-hint"></div>
        <div id="letters-container"></div>
        <div id="slots-container"></div>
        <button id="give-up-btn">我不会</button>
    `;
    
    // 添加触摸和鼠标事件监听
    const giveUpBtn = document.getElementById('give-up-btn');
    giveUpBtn.addEventListener('touchstart', moveButton, { passive: false });
    giveUpBtn.addEventListener('mousedown', moveButton);
    
    createGame().catch(error => console.error('游戏初始化失败:', error));
}

function moveButton(e) {
    e.preventDefault(); // 阻止默认行为
    
    const giveUpBtn = e.target;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const btnRect = giveUpBtn.getBoundingClientRect();
    
    // 随机生成新位置（保持在可视区域内）
    const newX = Math.random() * (viewportWidth - btnRect.width);
    const newY = Math.random() * (viewportHeight - btnRect.height);
    
    // 设置新位置
    giveUpBtn.style.position = 'fixed';
    giveUpBtn.style.left = `${newX}px`;
    giveUpBtn.style.top = `${newY}px`;
}

// 在页面加载完成后的初始化代码中也添加事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 设置按钮相关
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const cancelBtn = document.getElementById('cancel-btn');
    const saveBtn = document.getElementById('save-btn');
    const wordsInput = document.getElementById('words-input');

    // 显示设置面板
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'block';
        modalBackdrop.style.display = 'block';
        wordsInput.value = words.join('\n');
    });

    // 关闭设置面板
    cancelBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
        modalBackdrop.style.display = 'none';
    });

    // 保存设置
    saveBtn.addEventListener('click', () => {
        const newWords = wordsInput.value.split('\n')
            .map(word => word.trim())
            .filter(word => word.length > 0);
        
        if (newWords.length > 0) {
            words = newWords;
            localStorage.setItem('wordList', JSON.stringify(words));
            testedWords.clear();
            currentResults = [];
            audioUrls = {};
            createGame().catch(error => console.error('游戏初始化失败:', error));
        }
        
        settingsModal.style.display = 'none';
        modalBackdrop.style.display = 'none';
    });

    // 初始化游戏
    createGame().catch(error => {
        console.error('游戏初始化失败:', error);
        document.getElementById('word-hint').textContent = '游戏加载失败，请刷新页面重试';
    });
});

// 移除原有的 giveUp 函数，因为我们不再需要它了