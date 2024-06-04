const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const pool = require('./db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
    console.log('Novo usuário conectado');

    async function sendQuestion(questionId) {
        try {
            const res = await pool.query('SELECT * FROM questions WHERE id = $1', [questionId]);
            const question = res.rows[0];

            if (question.is_final) {
                socket.emit('final', question.question);
            } else {
                const optionsRes = await pool.query('SELECT * FROM questions WHERE parent_id = $1', [questionId]);
                const options = optionsRes.rows.map(opt => opt.answer);
                socket.emit('question', { question: question.question, options });
            }
        } catch (err) {
            console.error(err);
        }
    }

    let currentQuestionId = 1; // ID inicial da pergunta
    sendQuestion(currentQuestionId);

    socket.on('nextQuestion', async (answer) => {
        try {
            const res = await pool.query('SELECT * FROM questions WHERE parent_id = $1 AND answer = $2', [currentQuestionId, answer]);
            const nextQuestion = res.rows[0];

            if (nextQuestion) {
                currentQuestionId = nextQuestion.id;
                sendQuestion(currentQuestionId);
            } else {
                socket.emit('final', 'Resposta inválida ou caminho não encontrado. Tente novamente.');
            }
        } catch (err) {
            console.error(err);
        }
    });

    socket.on('inputAnswer', (answer) => {
        if (answer.trim()) {
            socket.emit('final', `Emissores impactados: ${answer}`);
        } else {
            socket.emit('final', 'Resposta inválida. Tente novamente.');
        }
    });

    socket.on('restart', () => {
        currentQuestionId = 1; // ID inicial da pergunta
        sendQuestion(currentQuestionId);
    });
});

server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
