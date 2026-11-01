const express = require('express');
const path = require('path');
const app = express();
const PORT = 3003;

app.use(express.static(__dirname));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 POS Z108 running on http://localhost:${PORT}`);
    console.log(`📱 Accessible sur http://localhost:${PORT}`);
});
