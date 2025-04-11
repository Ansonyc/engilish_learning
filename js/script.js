// 配置
const TOTAL_ROUNDS = 1;
const REWARDED_CHARACTERS_KEY = 'rewardedCharacters_1';
let words = [];

// 从网络加载词库
async function loadWords() {
    try {
        const response = await fetch('https://gist.githubusercontent.com/Ansonyc/ce344a8d67087e808b8a0b6ab4fa405e/raw/07c44999e30b6abb63fe24736f8d0323c9ffb293/words.txt');
        const text = await response.text();
        words = text.split('\n').filter(word => word.trim().length > 0);
        console.info('从网络加载词库成功');
        return true;
    } catch (error) {
        console.error('加载词库失败:', error);
        return false;
    }
}

let currentWord = '';
let testedWords = new Set();
let currentResults = [];
let audioUrls = {};

// 音效
const CHEER_SOUND = new Audio('https://assets.mixkit.co/active_storage/sfx/2993/2993-preview.mp3');
const SIGH_SOUND = new Audio('https://assets.mixkit.co/active_storage/sfx/473/473-preview.mp3');

// 从localStorage加载词库
// if (localStorage.getItem('wordList')) {
//     words = JSON.parse(localStorage.getItem('wordList'));
//     console.info('Loaded word list from localStorage.');
// }

// 更新 fetchWordMeaning 方法
async function fetchWordMeaning(word) {
    try {
        const youdao = await fetch(`https://engilish-learning.onrender.com/phonetic?word=${encodeURIComponent(word)}`)
        const youdaoData = await youdao.json();
        const baidu = await fetch(`https://engilish-learning.onrender.com/translate?word=${encodeURIComponent(word)}`)
        const baiduData = await baidu.json();
        // 使用 mp3 格式的音频，对移动设备更友好
        let translation = youdaoData.translation;
        if (baiduData.translation && baiduData.translation.length > 0) {
            translation = baiduData.translation;
        }

        return { 
            meaning: `[${youdaoData.phonetic}]\n${translation}`,
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

async function createGame() {
    console.info('createGame called');
    console.info(testedWords)
    if (testedWords.size >= TOTAL_ROUNDS) {
        showFinalResults();
        return;
    }

    // 选出合适数量的单词
    const rewardedCharacters = JSON.parse(localStorage.getItem(REWARDED_CHARACTERS_KEY) || '[]');
    console.info('words length: '+ words.length + ' rewarded characters length: '+ rewardedCharacters.length)
    const tmpWords = words.slice(0, 100 + 20 * rewardedCharacters.length);
    console.info('tmpWords length: '+ tmpWords.length)
    const availableWords = tmpWords.filter(word => !testedWords.has(word));
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
        <div style="text-align: center; width: 100%; margin: 0 auto;">
            <div style="margin-bottom: 10px; color: #666;">第 ${testedWords.size} / ${TOTAL_ROUNDS} 轮</div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <span style="white-space: pre-wrap; word-break: break-word;">提示：${meaning}</span>
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
// 在文件开头添加
function updateRewardsButton() {
    const rewardedCharacters = JSON.parse(localStorage.getItem(REWARDED_CHARACTERS_KEY) || '[]');
    console.info('rewardedCharacters : ' + rewardedCharacters)
    const rewardsBtn = document.getElementById('rewards-btn');
    rewardsBtn.style.display = rewardedCharacters.length > 0 ? 'block' : 'none';
}

function showRewardsModal() {
    const rewardsModal = document.getElementById('rewards-modal');
    const rewardsContainer = document.getElementById('rewards-container');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const rewardedCharacters = JSON.parse(localStorage.getItem(REWARDED_CHARACTERS_KEY) || '[]');
    
    // 重置模态框内容
    rewardsModal.innerHTML = `
        <div class="rewardsmodal-content">
            <div class="modal-header">
                <h2>已获得的角色</h2>
            </div>
            <div id="rewards-container" class="rewards-container"></div>
            <div class="modal-footer">
                <button class="common-button" onclick="closeRewardsModal()">关闭</button>
            </div>
        </div>
    `;

    // 获取新的容器引用
    const newRewardsContainer = document.getElementById('rewards-container');
    
    // 填充角色卡片
    rewardedCharacters.forEach(characterName => {
        const character = people_descriptions.find(p => p[0] === characterName);
        if (character) {
            const div = document.createElement('div');
            div.className = 'reward-item';
            div.style.textAlign = 'center';
            div.style.backgroundColor = '#f5f5f5';
            div.style.borderRadius = '4px';
            div.style.overflow = 'hidden';
            div.style.margin = '0';
            div.style.padding = '0';
            div.innerHTML = `
                <div class="character-card" style="display: flex; flex-direction: column;">
                    <img src="resources/人物/${character[0]}.png" alt="${character[0]}" 
                         style="width: 100%; height: auto; display: block;">
                    <h3 style="margin: 8px 0; font-size: 14px; padding: 0 5px;">${character[0]}</h3>
                </div>
            `;
            newRewardsContainer.appendChild(div);
        }
    });

    modalBackdrop.style.display = 'block';
    rewardsModal.style.display = 'block';
}

function closeRewardsModal() {
    const rewardsModal = document.getElementById('rewards-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    rewardsModal.style.display = 'none';
    modalBackdrop.style.display = 'none';
}

// 修改 DOMContentLoaded 事件监听器为异步函数
document.addEventListener('DOMContentLoaded', async () => {
    // 先加载词库
    const wordsLoaded = await loadWords();
    if (!wordsLoaded) {
        document.getElementById('word-hint').textContent = '词库加载失败，请刷新页面重试';
        return;
    }

    // 设置按钮相关
    const settingsModal = document.getElementById('settings-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const cancelBtn = document.getElementById('cancel-btn');
    const saveBtn = document.getElementById('save-btn');
    const wordsInput = document.getElementById('words-input');
    const rewardsBtn = document.getElementById('rewards-btn');  // 添加这行

    // 添加奖励按钮点击事件
    rewardsBtn.addEventListener('click', showRewardsModal);

    // // 显示设置面板
    // settingsBtn.addEventListener('click', () => {
    //     settingsModal.style.display = 'block';
    //     modalBackdrop.style.display = 'block';
    //     wordsInput.value = words.join('\n');
    // });

    // // 关闭设置面板
    // cancelBtn.addEventListener('click', () => {
    //     settingsModal.style.display = 'none';
    //     modalBackdrop.style.display = 'none';
    // });

    // // 保存设置
    // saveBtn.addEventListener('click', () => {
    //     const newWords = wordsInput.value.split('\n')
    //         .map(word => word.trim())
    //         .filter(word => word.length > 0);
        
    //     if (newWords.length > 0) {
    //         words = newWords;
    //         localStorage.setItem('wordList', JSON.stringify(words));
    //         testedWords.clear();
    //         currentResults = [];
    //         audioUrls = {};
    //         console.info('Words updated:', words);
    //         createGame().catch(error => console.error('游戏初始化失败:', error));
    //     }
        
    //     settingsModal.style.display = 'none';
    //     modalBackdrop.style.display = 'none';
    // });

    console.info('DOMContentLoaded event fired');
    // 初始化游戏
    createGame().catch(error => {
        console.error('游戏初始化失败:', error);
        document.getElementById('word-hint').textContent = '游戏加载失败，请刷新页面重试';
    });

    updateRewardsButton();
});

// 移除原有的 giveUp 函数，因为我们不再需要它了
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
        // 获取已奖励的角色
        const rewardedCharacters = JSON.parse(localStorage.getItem(REWARDED_CHARACTERS_KEY) || '[]');
        
        // 过滤掉已奖励的角色
        const availableCharacters = people_descriptions.filter(person => 
            !rewardedCharacters.includes(person[0])
        );

        if (availableCharacters.length > 0) {
            // 记录新奖励的角色
            const selectedPerson = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
            rewardedCharacters.push(selectedPerson[0]);
            localStorage.setItem(REWARDED_CHARACTERS_KEY, JSON.stringify(rewardedCharacters));
            
            // 更新奖励按钮显示状态
            updateRewardsButton();
            
            showCelebration(selectedPerson);
        } else {
            alert('恭喜你！你已经收集了所有角色！');
        }
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
    console.info('restartGame called');
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