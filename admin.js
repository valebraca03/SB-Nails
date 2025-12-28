import { ADMIN_UID, monthNames, services } from './data.js';

let blockedDates = [];
let adminAppointments = [];
let adminUsers = [];
let adminCurrentMonth = new Date().getMonth();
let adminCurrentYear = new Date().getFullYear();

function showAdminSection(section) {
    const appointmentsSection = document.getElementById('adminAppointmentsSection');
    const usersSection = document.getElementById('adminUsersSection');
    const calendarSection = document.getElementById('adminCalendarSection');
    const tabAppointments = document.getElementById('adminTabAppointments');
    const tabUsers = document.getElementById('adminTabUsers');
    const tabCalendar = document.getElementById('adminTabCalendar');

    if (appointmentsSection && usersSection && calendarSection && tabAppointments && tabUsers && tabCalendar) {
        appointmentsSection.style.display = section === 'appointments' ? 'block' : 'none';
        usersSection.style.display = section === 'users' ? 'block' : 'none';
        calendarSection.style.display = section === 'calendar' ? 'block' : 'none';

        tabAppointments.classList.toggle('active', section === 'appointments');
        tabUsers.classList.toggle('active', section === 'users');
        tabCalendar.classList.toggle('active', section === 'calendar');

        if (section === 'calendar') {
            renderAdminCalendar();
        }
    }
}

function getUserSession() {
    const userStr = localStorage.getItem('sbsofinails_user');
    return userStr ? JSON.parse(userStr) : null;
}

function isCurrentUserAdmin() {
    const currentUser = getUserSession();
    if (!currentUser) return false;
    if (!currentUser.uid) return false;
    return currentUser.uid === ADMIN_UID;
}

async function refreshBlockedDatesFromFirestore() {
    try {
        const { db, collection, getDocs } = await import('./firebaseConfig.js');
        const snapshot = await getDocs(collection(db, 'blocked_days'));
        const dates = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data && data.date) {
                dates.push(data.date);
            }
        });
        blockedDates = dates;
        if (document.getElementById('adminCalendarSection') && document.getElementById('adminCalendarSection').style.display !== 'none') {
            renderAdminCalendar();
        }
    } catch (error) {
        console.error('Error al cargar días bloqueados:', error);
    }
}

async function loadAdminAppointments() {
    try {
        toggleAdminLoading('adminAppointmentsSection', true);
        const { db, collection, getDocs } = await import('./firebaseConfig.js');
        const snapshot = await getDocs(collection(db, 'appointments'));
        const items = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            items.push({
                id: docSnap.id,
                ...data
            });
        });
        adminAppointments = items;
        renderAdminAppointments();
    } catch (error) {
        console.error('Error al cargar turnos para administración:', error);
    } finally {
        toggleAdminLoading('adminAppointmentsSection', false);
    }
}

async function loadAdminUsers() {
    try {
        toggleAdminLoading('adminUsersSection', true);
        const canUseFirestore = typeof navigator === 'undefined' ? true : navigator.onLine;
        if (!canUseFirestore) {
            alert('No se pueden cargar los usuarios porque no hay conexión a internet.');
            adminUsers = [];
            renderAdminUsers();
            return;
        }

        const { db, collection, getDocs } = await import('./firebaseConfig.js');
        const snapshot = await getDocs(collection(db, 'users'));
        const items = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            items.push({
                id: docSnap.id,
                ...data
            });
        });
        adminUsers = items;
        renderAdminUsers();
    } catch (error) {
        console.error('Error al cargar usuarios para administración:', error);
    } finally {
        toggleAdminLoading('adminUsersSection', false);
    }
}

function toggleAdminLoading(sectionId, show) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    let loader = section.querySelector('.admin-loader');
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.className = 'admin-loader';
            loader.innerHTML = '<div class="admin-spinner"></div><p>Cargando datos...</p>';
            section.appendChild(loader);
        }
        loader.style.display = 'flex';
        const table = section.querySelector('.table-wrapper');
        if (table) table.style.opacity = '0.3';
    } else {
        if (loader) loader.style.display = 'none';
        const table = section.querySelector('.table-wrapper');
        if (table) table.style.opacity = '1';
    }
}

function populateAdminServiceFilter() {
    const select = document.getElementById('adminFilterService');
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '<option value="">Todos</option>';
    Object.keys(services).forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = services[key].name;
        select.appendChild(opt);
    });
    select.value = currentVal;
}

function getAppointmentFilters() {
    const dateInput = document.getElementById('adminFilterDate');
    const serviceSelect = document.getElementById('adminFilterService');
    const statusSelect = document.getElementById('adminFilterStatus');
    return {
        date: dateInput ? dateInput.value : '',
        service: serviceSelect ? serviceSelect.value : '',
        status: statusSelect ? statusSelect.value : ''
    };
}

function renderAdminAppointments() {
    const tbody = document.getElementById('adminAppointmentsTableBody');
    if (!tbody) return;
    const filters = getAppointmentFilters();
    let rows = adminAppointments.slice();
    if (filters.date) {
        rows = rows.filter(a => a.date === filters.date);
    }
    if (filters.service) {
        rows = rows.filter(a => a.serviceId === filters.service);
    }
    if (filters.status) {
        if (filters.status !== 'Todos') {
            rows = rows.filter(a => (a.status || 'pendiente') === filters.status);
        }
    } else {
        rows = rows.filter(a => ['pendiente', 'reprogramado'].includes(a.status || 'pendiente'));
    }
    rows.sort((a, b) => {
        const keyA = `${a.date || ''} ${a.time || ''}`;
        const keyB = `${b.date || ''} ${b.time || ''}`;
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
    });
    tbody.innerHTML = '';
    rows.forEach(app => {
        const tr = document.createElement('tr');
        const status = app.status || 'pendiente';
        tr.innerHTML = `
            <td>${app.clientName || ''}</td>
            <td>${app.serviceName || ''}</td>
            <td>${app.date || ''}</td>
            <td>${app.time || ''}</td>
            <td>${status}</td>
            <td>
                <button type="button" title="Marcar como realizado" onclick="adminMarkAppointmentDone('${app.id}')"><i class="fas fa-check"></i></button>
                <button type="button" title="Reprogramar" onclick="adminRescheduleAppointment('${app.id}')"><i class="fas fa-clock"></i></button>
                <button type="button" title="Cancelar" onclick="adminCancelAppointment('${app.id}')"><i class="fas fa-times"></i></button>
                <button type="button" class="btn-reminder" title="Enviar Recordatorio" onclick="adminSendReminder('${app.id}')"><i class="fas fa-bell"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function adminRescheduleAppointment(appointmentId) {
    const appointment = adminAppointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    const newDate = prompt('Nueva fecha (AAAA-MM-DD):', appointment.date || '');
    if (!newDate) return;
    const newTime = prompt('Nueva hora (HH:MM):', appointment.time || '');
    if (!newTime) return;
    await updateAppointment(appointmentId, {
        date: newDate,
        time: newTime,
        status: 'reprogramado'
    }, appointment.clientPhone);

    if (appointment.userUid && window.sendNotification) {
        window.sendNotification(
            appointment.userUid,
            "Turno Reprogramado",
            `Tu cita ha sido movida al ${newDate} a las ${newTime} hs.`
        );
    }
}

async function adminCancelAppointment(appointmentId) {
    const appointment = adminAppointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    const confirmCancel = confirm('¿Cancelar este turno?');
    if (!confirmCancel) return;
    await updateAppointment(appointmentId, {
        status: 'cancelado'
    }, appointment.clientPhone);

    if (appointment.userUid && window.sendNotification) {
        window.sendNotification(
            appointment.userUid,
            "Turno Cancelado",
            `Tu cita para el ${appointment.date} ha sido cancelada.`
        );
    }
}

async function adminMarkAppointmentDone(appointmentId) {
    const appointment = adminAppointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    const confirmDone = confirm(`¿Confirmar turno de ${appointment.clientName}? Se sumarán puntos y visitas si es usuario registrado.`);
    if (!confirmDone) return;

    try {
        await updateAppointment(appointmentId, {
            status: 'realizado'
        }, null);

        if (appointment.userUid) {
            const user = adminUsers.find(u => u.uid === appointment.userUid);
            if (user) {
                await adminChangeUserPoints(user.uid, 50);

                const { db, doc, updateDoc, increment } = await import('./firebaseConfig.js');
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    Visitas: increment(1)
                });

                user.Visitas = (user.Visitas || 0) + 1;
                renderAdminUsers();

                if (window.sendNotification) {
                    window.sendNotification(
                        user.uid,
                        "¡Cita Completada!",
                        `¡Suma y sigue! Has ganado 50 puntos por tu visita de hoy. ¡Gracias por elegirnos!`
                    );
                    if (user.Puntos >= 100 && (user.Puntos - 50) < 100) {
                        window.sendNotification(user.uid, "¡Premio Disponible!", "¡Felicidades! Has alcanzado los puntos para tu primera recompensa.");
                    }
                }
                alert(`Turno completado. Se sumaron 50 puntos y 1 visita a ${user.NombreCompleto}.`);
            } else {
                alert('Turno completado. (Usuario no encontrado)');
            }
        } else {
            alert('Turno completado. (Cliente invitado, no suma puntos)');
        }
    } catch (error) {
        console.error("Error al completar turno:", error);
        alert("Hubo un error al procesar el turno.");
    }
}

async function adminSendReminder(appointmentId) {
    const appointment = adminAppointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    if (!appointment.userUid) {
        const confirmWA = confirm("Esta clienta no está registrada. ¿Enviar recordatorio por WhatsApp?");
        if (confirmWA) {
            const msg = encodeURIComponent(`¡Hola ${appointment.clientName}! 🔔 Te recordamos tu cita hoy a las ${appointment.time} hs. ¡Te esperamos!`);
            const url = `https://wa.me/${appointment.clientPhone.replace(/[^0-9]/g, '')}?text=${msg}`;
            window.open(url, '_blank');
        }
        return;
    }

    if (window.sendNotification) {
        await window.sendNotification(
            appointment.userUid,
            "Recordatorio de Turno",
            `¡Hola! Te recordamos tu cita hoy a las ${appointment.time} hs. ¡Te esperamos!`
        );
        alert(`Recordatorio enviado a ${appointment.clientName}`);
    } else {
        alert("El sistema de notificaciones no está inicializado.");
    }
}

async function updateAppointment(appointmentId, data, clientPhone) {
    try {
        const { db, doc, updateDoc } = await import('./firebaseConfig.js');
        const ref = doc(db, 'appointments', appointmentId);
        await updateDoc(ref, data);
        adminAppointments = adminAppointments.map(a => {
            if (a.id === appointmentId) {
                return { ...a, ...data };
            }
            return a;
        });
        renderAdminAppointments();
        if (clientPhone) {
            const message = encodeURIComponent('Hola, hubo una actualización en tu turno con Sbsofinails.');
            const url = `https://wa.me/${clientPhone.replace(/[^0-9]/g, '')}?text=${message}`;
            window.open(url, '_blank');
        }
    } catch (error) {
        console.error('Error al actualizar turno:', error);
        alert('No se pudo actualizar el turno.');
    }
}

function getUserSearchText() {
    const input = document.getElementById('adminUserSearch');
    return input ? input.value.trim().toLowerCase() : '';
}

function renderAdminUsers() {
    const tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;
    const search = getUserSearchText();
    let rows = adminUsers.slice();
    if (search) {
        rows = rows.filter(u => {
            const name = (u.NombreCompleto || '').toLowerCase();
            const email = (u.Email || '').toLowerCase();
            const phone = (u.Numero || '').toLowerCase();
            return name.includes(search) || email.includes(search) || phone.includes(search);
        });
    }
    rows.sort((a, b) => {
        const nameA = (a.NombreCompleto || '').toLowerCase();
        const nameB = (b.NombreCompleto || '').toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });
    tbody.innerHTML = '';
    if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No hay usuarios registrados.</td></tr>';
        return;
    }

    rows.forEach(user => {
        const tr = document.createElement('tr');
        const puntos = user.Puntos || 0;
        const visitas = user.Visitas || 0;
        const activo = user.Activo !== false;
        tr.innerHTML = [
            `<td>${user.NombreCompleto || ''}</td>`,
            `<td>${user.Email || ''}</td>`,
            `<td>${user.Numero || ''}</td>`,
            `<td>${puntos}</td>`,
            `<td>${visitas}</td>`,
            `<td>${activo ? 'Activo' : 'Inactivo'}</td>`,
            `<td>
                <button type="button" title="Sumar 10 puntos" onclick="adminChangeUserPoints('${user.uid}', 10)"><i class="fas fa-plus"></i></button>
                <button type="button" title="Restar 10 puntos" onclick="adminChangeUserPoints('${user.uid}', -10)"><i class="fas fa-minus"></i></button>
                <button type="button" title="${activo ? 'Desactivar' : 'Activar'}" onclick="adminToggleUserActive('${user.uid}', ${activo})">
                    <i class="fas ${activo ? 'fa-user-slash' : 'fa-user-check'}"></i>
                </button>
            </td>`
        ].join('');
        tbody.appendChild(tr);
    });
}

async function adminChangeUserPoints(uid, delta) {
    const user = adminUsers.find(u => u.uid === uid);
    if (!user) return;
    const newPoints = (user.Puntos || 0) + delta;
    try {
        const { db, doc, updateDoc } = await import('./firebaseConfig.js');
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, { Puntos: newPoints });
        adminUsers = adminUsers.map(u => u.uid === uid ? { ...u, Puntos: newPoints } : u);
        renderAdminUsers();
    } catch (error) {
        alert('Error al actualizar puntos.');
    }
}

async function adminToggleUserActive(uid, active) {
    try {
        const { db, doc, updateDoc } = await import('./firebaseConfig.js');
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, { Activo: !active });
        adminUsers = adminUsers.map(u => u.uid === uid ? { ...u, Activo: !active } : u);
        renderAdminUsers();
    } catch (error) {
        alert('Error al actualizar estado.');
    }
}

async function adminResetUserPassword(email) {
    if (!email) return alert('No hay correo.');
    try {
        const { auth, sendPasswordResetEmail } = await import('./firebaseConfig.js');
        await sendPasswordResetEmail(auth, email);
        alert('Correo enviado.');
    } catch (error) {
        alert('Error al enviar correo.');
    }
}

function setupAdminCalendarNavigation() {
    const prevBtn = document.getElementById('adminPrevMonth');
    const nextBtn = document.getElementById('adminNextMonth');
    updateCalendarNavigationButtons();
    if (prevBtn) {
        prevBtn.onclick = () => {
            const now = new Date();
            if (adminCurrentYear === now.getFullYear() && adminCurrentMonth === now.getMonth()) return;
            adminCurrentMonth--;
            if (adminCurrentMonth < 0) { adminCurrentMonth = 11; adminCurrentYear--; }
            renderAdminCalendar();
        };
    }
    if (nextBtn) {
        nextBtn.onclick = () => {
            adminCurrentMonth++;
            if (adminCurrentMonth > 11) { adminCurrentMonth = 0; adminCurrentYear++; }
            renderAdminCalendar();
        };
    }
}

function updateCalendarNavigationButtons() {
    const prevBtn = document.getElementById('adminPrevMonth');
    if (!prevBtn) return;
    const now = new Date();
    if (adminCurrentYear === now.getFullYear() && adminCurrentMonth <= now.getMonth()) {
        prevBtn.disabled = true; prevBtn.style.opacity = '0.3';
    } else {
        prevBtn.disabled = false; prevBtn.style.opacity = '1';
    }
}

function renderAdminCalendar() {
    const calendarDays = document.getElementById('adminCalendarDays');
    if (!calendarDays) return;
    calendarDays.innerHTML = '';
    const monthDisplay = document.getElementById('adminCurrentMonth');
    if (monthDisplay) monthDisplay.textContent = `${monthNames[adminCurrentMonth]} ${adminCurrentYear}`;
    updateCalendarNavigationButtons();

    const firstDay = new Date(adminCurrentYear, adminCurrentMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dayElement = document.createElement('div');
        dayElement.className = 'modal-calendar-day';
        dayElement.textContent = date.getDate();
        const dateString = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();
        const isPastDate = date < today;

        if (date.getMonth() !== adminCurrentMonth) {
            dayElement.classList.add('other-month');
        } else if (isPastDate) {
            dayElement.classList.add('disabled');
        } else if (dayOfWeek === 0) {
            dayElement.classList.add('sunday');
        } else {
            if (blockedDates.includes(dateString)) dayElement.classList.add('occupied');
            dayElement.addEventListener('click', () => handleAdminDateClick(dateString));
        }
        calendarDays.appendChild(dayElement);
    }
}

async function handleAdminDateClick(dateStr) {
    const isBlocked = blockedDates.includes(dateStr);
    const text = isBlocked ? `¿Desbloquear ${dateStr}?` : `¿Bloquear ${dateStr}?`;
    if (confirm(text)) await adminSetBlockStatus(dateStr, !isBlocked);
}

async function adminSetBlockStatus(dateStr, block) {
    try {
        const { db, doc, setDoc, deleteDoc } = await import('./firebaseConfig.js');
        const ref = doc(db, 'blocked_days', dateStr);
        if (block) {
            await setDoc(ref, { date: dateStr, createdAt: new Date().toISOString() });
            if (!blockedDates.includes(dateStr)) blockedDates.push(dateStr);
        } else {
            await deleteDoc(ref);
            blockedDates = blockedDates.filter(d => d !== dateStr);
        }
        renderAdminCalendar();
    } catch (error) {
        alert('Error al actualizar estado del día.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!isCurrentUserAdmin()) {
        alert('Acceso restringido.');
        window.location.href = 'index.html';
        return;
    }
    setupAdminCalendarNavigation();
    populateAdminServiceFilter();
    await Promise.all([loadAdminAppointments(), loadAdminUsers(), refreshBlockedDatesFromFirestore()]);
});

// Exponer a global
window.showAdminSection = showAdminSection;
window.renderAdminAppointments = renderAdminAppointments;
window.renderAdminUsers = renderAdminUsers;
window.adminMarkAppointmentDone = adminMarkAppointmentDone;
window.adminRescheduleAppointment = adminRescheduleAppointment;
window.adminCancelAppointment = adminCancelAppointment;
window.adminSendReminder = adminSendReminder;
window.adminChangeUserPoints = adminChangeUserPoints;
window.adminToggleUserActive = adminToggleUserActive;
window.adminResetUserPassword = adminResetUserPassword;
