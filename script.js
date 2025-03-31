document.addEventListener('DOMContentLoaded', function () {
    const periodColors = {
        'Matutino': '#2196F3',
        'Vespertino': '#FF9800',
        'Noturno': '#AB47BC'
    };

    const calendarEl = document.getElementById('calendar');
    const toggleCalendarBtn = document.getElementById('toggleCalendarBtn');
    const toggleCalendarBtnMobile = document.getElementById('toggleCalendarBtnMobile');
    const visualizarBtn = document.getElementById('visualizarBtn');
    const visualizarBtnMobile = document.getElementById('visualizarBtnMobile');
    const agendamentosTable = document.getElementById('agendamentosBody').parentElement.parentElement;
    const agendamentosBody = document.getElementById('agendamentosBody');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginSection = document.getElementById('loginSection');
    const periodoSelect = document.getElementById('periodo');
    const horarioSelect = document.getElementById('horario');
    const legendList = document.getElementById('legendList');

    // Preencher a legenda
    Object.keys(periodColors).forEach(period => {
        const li = document.createElement('li');
        li.textContent = period;
        li.style.setProperty('--legend-color', periodColors[period]);
        legendList.appendChild(li);
    });

    let isAdmin = false;

    // Função para carregar os agendamentos
    function carregarAgendamentos() {
        fetch('/api/agendamentos')
            .then(response => response.json())
            .then(data => {
                agendamentosBody.innerHTML = '';
                data.forEach(agendamento => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${agendamento.title.split(' - ')[1]}</td>
                        <td>${agendamento.disciplina || '-'}</td>
                        <td>${agendamento.turma || '-'}</td>
                        <td>${agendamento.title.split(' - ')[0]}</td>
                        <td>${agendamento.start.split('T')[0]}</td>
                        <td>${agendamento.periodo}</td>
                        <td>${agendamento.horario || '-'}</td>
                        <td>${isAdmin ? `<button class="delete-btn" data-id="${agendamento.id}">Excluir</button>` : ''}</td>
                    `;
                    agendamentosBody.appendChild(row);
                });

                // Adicionar eventos aos botões de exclusão
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.getAttribute('data-id');
                        excluirAgendamento(id);
                    });
                });
            })
            .catch(error => console.error('Erro ao carregar agendamentos:', error));
    }

    // Função para excluir agendamento
    function excluirAgendamento(id) {
        if (confirm('Tem certeza que deseja excluir este agendamento?')) {
            fetch(`/api/agendamentos/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.error || 'Erro ao excluir agendamento'); });
                }
                return response.json();
            })
            .then(data => {
                alert('Agendamento excluído com sucesso!');
                calendar.refetchEvents();
                carregarAgendamentos();
            })
            .catch(error => {
                alert(error.message);
                console.error('Erro:', error);
            });
        }
    }

    let calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        height: 'auto',
        dayMaxEventRows: true,
        moreLinkClick: 'popover',
        weekends: false,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: '/api/agendamentos',
        eventDisplay: 'block',
        eventTextColor: '#fff',
        eventBorderColor: 'transparent',
        windowResize: function () {
            if (window.innerWidth <= 480) {
                calendar.setOption('height', 'auto');
                calendar.changeView('timeGridDay');
            } else if (window.innerWidth <= 768) {
                calendar.setOption('height', 'auto');
                calendar.changeView('dayGridWeek');
            } else {
                calendar.setOption('height', 'auto');
                calendar.changeView('dayGridMonth');
            }
        },
        eventDidMount: function (info) {
            const period = info.event.extendedProps.periodo;
            const color = periodColors[period] || '#1A3C34';
            info.el.style.backgroundColor = color;
            info.el.style.borderColor = color;
        }
    });

    calendar.render();

    // Função para atualizar os horários com base no período
    function atualizarHorarios() {
        horarioSelect.innerHTML = '<option value="" disabled selected>Selecione um horário</option>';
        const periodo = periodoSelect.value;
        let horarios = [];
        if (periodo === 'Matutino') {
            horarios = ['1ª Aula', '2ª Aula', '3ª Aula', '4ª Aula', '5ª Aula', '6ª Aula'];
        } else if (periodo === 'Vespertino' || periodo === 'Noturno') {
            horarios = ['1ª Aula', '2ª Aula', '3ª Aula', '4ª Aula', '5ª Aula'];
        }
        horarios.forEach(horario => {
            const option = document.createElement('option');
            option.value = horario;
            option.textContent = horario;
            horarioSelect.appendChild(option);
        });
    }

    periodoSelect.addEventListener('change', atualizarHorarios);

    // Evento de submit do formulário de agendamento
    document.getElementById('agendamentoForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const agendamento = {
            nome: document.getElementById('nome').value,
            disciplina: document.getElementById('disciplina').value,
            turma: document.getElementById('turma').value,
            recurso: document.getElementById('recurso').value,
            data: document.getElementById('data').value,
            horario: document.getElementById('horario').value,
            periodo: document.getElementById('periodo').value
        };

        
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message); });
            }
            return response.json();
        })
        .then(data => {
            alert('Agendamento realizado com sucesso!');
            calendar.refetchEvents();
            carregarAgendamentos();
            this.reset();
            atualizarHorarios();
        })
        .catch(error => {
            alert(error.message || 'Erro ao realizar o agendamento.');
            console.error('Erro:', error);
        });
    });

    function showCalendar() {
        calendarEl.style.display = 'block';
        agendamentosTable.style.display = 'none';
        toggleCalendarBtn.disabled = true;
        toggleCalendarBtnMobile.disabled = true;
        visualizarBtn.disabled = false;
        visualizarBtnMobile.disabled = false;
    }

    function showAgendamentos() {
        calendarEl.style.display = 'none';
        agendamentosTable.style.display = 'block';
        carregarAgendamentos();
        toggleCalendarBtn.disabled = false;
        toggleCalendarBtnMobile.disabled = false;
        visualizarBtn.disabled = true;
        visualizarBtnMobile.disabled = true;
    }

    function iniciarExibicao() {
        if (window.innerWidth <= 768) {
            showAgendamentos();
        } else {
            showCalendar();
        }
    }

    toggleCalendarBtn.addEventListener('click', showCalendar);
    toggleCalendarBtnMobile.addEventListener('click', showCalendar);
    visualizarBtn.addEventListener('click', showAgendamentos);
    visualizarBtnMobile.addEventListener('click', showAgendamentos);

    // Login Admin
    loginBtn.addEventListener('click', function() {
        loginSection.style.display = 'block';
        loginBtn.style.display = 'none';
    });

    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const user = document.getElementById('adminUser').value;
        const pass = document.getElementById('adminPass').value;

        if (user === 'admin' && pass === '1234') {
            isAdmin = true;
            loginSection.style.display = 'none';
            logoutBtn.style.display = 'block';
            alert('Login realizado com sucesso!');
            carregarAgendamentos();
        } else {
            alert('Usuário ou senha incorretos.');
        }
    });

    logoutBtn.addEventListener('click', function() {
        isAdmin = false;
        logoutBtn.style.display = 'none';
        loginBtn.style.display = 'block';
        agendamentosTable.style.display = 'none';
        toggleCalendarBtn.disabled = false;
        toggleCalendarBtnMobile.disabled = false;
        alert('Logout realizado.');
    });

    iniciarExibicao();
});
