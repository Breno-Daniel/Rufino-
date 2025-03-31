const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname + '/public'));

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error(err.message);
    console.log('Conectado ao SQLite.');
});

db.run(`CREATE TABLE IF NOT EXISTS agendamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    disciplina TEXT,
    turma TEXT,
    recurso TEXT,
    data TEXT,
    horario TEXT,
    periodo TEXT
)`);

app.get('/api/agendamentos', (req, res) => {
    db.all('SELECT * FROM agendamentos', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const events = rows.map(row => ({
            id: row.id,
            title: `${row.recurso} - ${row.nome}`,
            start: `${row.data}T${row.horario === '1ª Aula' ? '08:00' : row.horario === '2ª Aula' ? '09:00' : row.horario === '3ª Aula' ? '10:00' : row.horario === '4ª Aula' ? '11:00' : row.horario === '5ª Aula' ? '12:00' : '13:00'}`,
            periodo: row.periodo,
            disciplina: row.disciplina,
            turma: row.turma,
            horario: row.horario
        }));
        res.json(events);
    });
});

app.post('/api/agendamentos', (req, res) => {
    const { nome, disciplina, turma, recurso, data, horario, periodo } = req.body;

    db.get(
        `SELECT * FROM agendamentos WHERE recurso = ? AND data = ? AND periodo = ? AND horario = ?`,
        [recurso, data, periodo, horario],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (row) {
                return res.status(400).json({
                    message: `Conflito: O recurso "${recurso}" já está agendado para ${data}, ${periodo}, ${horario}.`
                });
            }

            db.run(
                `INSERT INTO agendamentos (nome, disciplina, turma, recurso, data, horario, periodo) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [nome, disciplina, turma, recurso, data, horario, periodo],
                function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ id: this.lastID });
                }
            );
        }
    );
});

app.delete('/api/agendamentos/:id', (req, res) => {
    const id = req.params.id;
    console.log('Tentando excluir agendamento com ID:', id);
    db.run(`DELETE FROM agendamentos WHERE id = ?`, [id], function(err) {
        if (err) {
            console.error('Erro no servidor:', err.message);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            console.log('Nenhum agendamento encontrado com ID:', id);
            return res.status(404).json({ error: 'Agendamento não encontrado' });
        }
        console.log('Agendamento excluído com sucesso, ID:', id);
        res.status(200).json({ message: 'Agendamento excluído' });
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

// Fechar o banco de dados ao encerrar o servidor
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) console.error(err.message);
        console.log('Conexão com SQLite fechada.');
        process.exit(0);
    });
});