const express = require('express');
const cors = require('cors');
const axios = require('axios');
const md5 = require('md5');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());  // 添加 CORS 支持

// 添加获取音标的接口
// 修改获取音标的接口
app.get('/phonetic', async (req, res) => {
    try {
        const { word } = req.query;
        if (!word) {
            return res.status(400).json({ error: '单词不能为空' });
        }
        
        const response = await axios.get(`https://dict.youdao.com/jsonapi?q=${encodeURIComponent(word)}`);
        
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

app.use(express.static('.'));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});