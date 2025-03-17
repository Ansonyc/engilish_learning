const express = require('express');
const cors = require('cors');
const axios = require('axios');
const md5 = require('md5');

const app = express();
app.use(cors());

const BAIDU_APP_ID = '20250317002306712';
const BAIDU_KEY = '1Ho7cPXr1mqvprhLpGnP';

// 合并后的单一接口
app.get('/translate', async (req, res) => {
    try {
        const { word } = req.query;
        if (!word) {
            return res.status(400).json({ error: '单词不能为空' });
        }
        
        const salt = Date.now();
        const sign = md5(BAIDU_APP_ID + word + salt + BAIDU_KEY);
        
        const response = await axios.get('https://fanyi-api.baidu.com/api/trans/vip/translate', {
            params: {
                q: word,
                from: 'en',
                to: 'zh',
                appid: BAIDU_APP_ID,
                salt: salt,
                sign: sign
            }
        });
        
        if (response.data.trans_result && response.data.trans_result[0]) {
            console.info(response.data);
            const result = response.data.trans_result[0];
            res.json({
                meaning: `${result.dst}`,
                audioUrl: `https://fanyi.baidu.com/gettts?lan=en&text=${encodeURIComponent(word)}&spd=3&source=web`
            });
        } else {
            res.json({ 
                meaning: '获取释义失败',
                audioUrl: null
            });
        }
    } catch (error) {
        console.error('API 错误:', error.response?.data || error.message);
        res.status(500).json({ 
            meaning: '获取释义失败',
            audioUrl: null
        });
    }
});

// 添加获取音标的接口
// 修改获取音标的接口
app.get('/phonetic', async (req, res) => {
    try {
        const { word } = req.query;
        if (!word) {
            return res.status(400).json({ error: '单词不能为空' });
        }
        
        const response = await axios.get(`https://dict.youdao.com/jsonapi?q=${encodeURIComponent(word)}`);
        
        if (response.data?.ec?.word?.[0]?.ukphone) {
            console.info(response.data);
            res.json({ phonetic: response.data.ec.word[0].ukphone });
        } else {
            res.json({ phonetic: '' });
        }
    } catch (error) {
        console.error('获取音标错误:', error.response?.data || error.message);
        res.status(500).json({ phonetic: '' });
    }
});

app.use(express.static('.'));

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});