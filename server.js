const express = require('express');
const cors = require('cors');
const axios = require('axios');
const md5 = require('md5');

// 从环境变量中读取配置
const BAIDU_APP_ID = process.env.BAIDU_APP_ID;
const BAIDU_SECRET = process.env.BAIDU_SECRET;
const WORDS_CONFIG_URL = process.env.WORDS_CONFIG_URL;

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// 添加获取单词列表的接口
app.get('/words', async (req, res) => {
    try {
        const response = await axios.get(WORDS_CONFIG_URL);
        res.send(response.data);
    } catch (error) {
        console.error('获取单词列表失败:', error);
        res.status(500).send('获取单词列表失败');
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
        // console.info('获取音标响应:', response.data);  // Log the response for debugging
        if (response.data?.ec?.word?.[0]) {
            const wordInfo = response.data.ec.word[0];
            const phonetic = wordInfo.usphone || '';
            const trs = wordInfo.trs?.map(tr => tr.tr[0].l.i[0]) || [];
            res.json({ 
                phonetic,
                translation: trs.join('；')
            });
        } else {
            res.json({ 
                phonetic: '',
                translation: ''
            });
        }
    } catch (error) {
        console.error('获取音标错误:', error.response?.data || error.message);
        res.status(500).json({ 
            phonetic: '',
            translation: ''
        });
    }
});

// 修改翻译接口使用百度 API
app.get('/translate', async (req, res) => {
    try {
        const { word } = req.query;
        if (!word) {
            return res.status(400).json({ error: '单词不能为空' });
        }

        const salt = Date.now();
        const sign = md5(BAIDU_APP_ID + word + salt + BAIDU_SECRET);
        
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
        // console.info('获取翻译响应:', response.data);  // Log the response for debugging

        if (response.data?.trans_result?.[0]) {
            res.json({
                translation: response.data.trans_result[0].dst
            });
        } else {
            res.json({
                translation: ''
            });
        }
    } catch (error) {
        console.error('获取翻译错误:', error.response?.data || error.message);
        res.status(500).json({
            translation: ''
        });
    }
});

app.use(express.static('.'));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});