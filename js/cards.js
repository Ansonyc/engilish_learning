// 人物图片列表
const CHARACTER_IMAGES = [
    '張郃.png',
];

// 展示庆祝弹窗
async function showCelebration() {
    const modal = document.getElementById('celebration-modal');
    const characterImg = document.getElementById('character-image');
    
    const randomIndex = Math.floor(Math.random() * CHARACTER_IMAGES.length);
    characterImg.src = `resources/人物/${CHARACTER_IMAGES[randomIndex]}`;

    try {
        await new Promise((resolve, reject) => {
            characterImg.onload = resolve;
            characterImg.onerror = reject;
        });

        const currentImageName = CHARACTER_IMAGES[randomIndex].replace(/\.[^/.]+$/, "");
        const charInfo = people_descriptions.find(c => c.name === currentImageName);
        
        if (charInfo) {
            document.getElementById('char-name').textContent = charInfo.name || '';
            document.getElementById('char-subname').textContent = charInfo.sub_name || '';
            document.getElementById('char-brief').textContent = charInfo.brief || '';
            
            document.getElementById('char-story').innerHTML = `
                <span class="story-bg">演</span>${charInfo.story || '暂无数据'}
            `;
            document.getElementById('char-history').innerHTML = `
                <span class="history-bg">史</span>${charInfo.history || '暂无数据'}
            `;
        }
    } catch (error) {
        console.error('加载人物信息失败:', error);
    }
    
    modal.style.display = 'block';
}

// 关闭庆祝弹窗
function closeCelebration() {
    document.getElementById('celebration-modal').style.display = 'none';
}