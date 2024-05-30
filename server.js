const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

const decisionTree = {
    question: "Qual o ambiente impactado?",
    options: {
        "Produção": {
            question: "Qual o impacto detectado?",
            options: {
                "Timeout": {
                    question: "Qual o site afetado?",
                    options: {
                        "SP": {
                            question: "Impacta mais de um Emissor?",
                            options: {
                                "Sim, mais de um": {
                                    question: "Quais Emissores impactados?",
                                    input: true,
                                    options: ["Caixa Débito", "Bradesco Débito", "BB Débito"]
                                },
                                "Apenas um Emissor": "Verificar logs e configurações do emissor específico."
                            }
                        },
                        "RJ": {
                            question: "Impacta mais de um Emissor?",
                            options: {
                                "Sim, mais de um": {
                                    question: "Quais Emissores impactados?",
                                    input: true,
                                    options: ["Caixa Débito", "Bradesco Débito", "BB Débito"]
                                },
                                "Apenas um Emissor": "Verificar logs e configurações do emissor específico."
                            }
                        },
                        "SP e RJ": {
                            question: "Impacta mais de um Emissor?",
                            options: {
                                "Sim, mais de um": {
                                    question: "Quais Emissores impactados?",
                                    input: true,
                                    options: ["Caixa Débito", "Bradesco Débito", "BB Débito"]
                                },
                                "Apenas um Emissor": "Verificar logs e configurações do emissor específico."
                            }
                        }
                    }
                },
                "Desfazimento": "Verificar logs de transações e banco de dados.",
                "Negadas": "Verificar logs de autenticação e autorização."
            }
        },
        "Homologação": {
            question: "Qual é o impacto observado?",
            options: {
                "Desempenho lento": {
                    question: "O impacto é geral ou específico?",
                    options: {
                        "Geral": {
                            question: "Houve alguma mudança recente no sistema?",
                            options: {
                                "Sim": "Verificar as mudanças recentes e possíveis regressões.",
                                "Não": "Verificar recursos do sistema e carga de trabalho."
                            }
                        },
                        "Específico": {
                            question: "O impacto é em um serviço específico?",
                            options: {
                                "Sim": "Verificar logs e configurações do serviço específico.",
                                "Não": "Verificar rede e dependências externas."
                            }
                        }
                    }
                },
                "Erro de conexão": {
                    question: "O erro de conexão é intermitente ou constante?",
                    options: {
                        "Intermitente": {
                            question: "Houve alguma mudança recente na rede?",
                            options: {
                                "Sim": "Verificar mudanças na configuração de rede.",
                                "Não": "Verificar estabilidade da conexão de rede."
                            }
                        },
                        "Constante": {
                            question: "O serviço está ativo?",
                            options: {
                                "Sim": "Verificar configurações do serviço e firewall.",
                                "Não": "Verificar logs de inicialização e status do serviço."
                            }
                        }
                    }
                },
                "Serviço indisponível": {
                    question: "O serviço foi recentemente atualizado?",
                    options: {
                        "Sim": "Verificar se há problemas conhecidos na nova versão.",
                        "Não": "Verificar logs do serviço e dependências."
                    }
                }
            }
        }
    }
};

io.on('connection', (socket) => {
    console.log('Novo usuário conectado');

    function sendQuestion(node) {
        if (typeof node === 'string') {
            socket.emit('final', node);
        } else if (node.input) {
            socket.emit('inputQuestion', { question: node.question, options: node.options });
        } else {
            socket.emit('question', { question: node.question, options: Object.keys(node.options) });
        }
    }

    let currentNode = decisionTree;
    sendQuestion(currentNode);

    socket.on('nextQuestion', (answer) => {
        if (currentNode.options && currentNode.options[answer]) {
            currentNode = currentNode.options[answer];
            sendQuestion(currentNode);
        } else {
            socket.emit('final', 'Resposta inválida ou caminho não encontrado. Tente novamente.');
        }
    });

    socket.on('inputAnswer', (answer) => {
        if (answer.trim()) {
            // Aqui você pode adicionar lógica para validar ou processar a resposta escrita pelo usuário
            socket.emit('final', `Emissores impactados: ${answer}`);
        } else {
            socket.emit('final', 'Resposta inválida. Tente novamente.');
        }
    });

    socket.on('restart', () => {
        currentNode = decisionTree;
        sendQuestion(currentNode);
    });
});

server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
