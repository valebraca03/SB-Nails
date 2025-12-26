import { ADMIN_UID } from './data.js';

let blockedDates = [];
let adminAppointments = [];
let adminUsers = [];

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
        renderBlockedDaysList();
    } catch (error) {
        console.error('Error al cargar días bloqueados:', error);
    }
}

function renderBlockedDaysList() {
    const list = document.getElementById('adminBlockedDaysList');
    if (!list) return;
    list.innerHTML = '';
    const sorted = [...blockedDates].sort();
    sorted.forEach(date => {
        const li = document.createElement('li');
        li.textContent = date;
        list.appendChild(li);
    });
}

async function loadAdminAppointments() {
    try {
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
    }
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
        rows = rows.filter(a => (a.status || 'pendiente') === filters.status);
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
        tr.innerHTML = [
            `<td>${app.clientName || ''}</td>`,
            `<td>${app.serviceName || ''}</td>`,
            `<td>${app.date || ''}</td>`,
            `<td>${app.time || ''}</td>`,
            `<td>${status}</td>`,
            `<td>
                <button type="button" onclick="adminMarkAppointmentDone('${app.id}')">Realizado</button>
                <button type="button" onclick="adminRescheduleAppointment('${app.id}')">Reprogramar</button>
                <button type="button" onclick="adminCancelAppointment('${app.id}')">Cancelar</button>
            </td>`
        ].join('');
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
}

async function adminCancelAppointment(appointmentId) {
    const appointment = adminAppointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    const confirmCancel = confirm('¿Cancelar este turno?');
    if (!confirmCancel) return;
    await updateAppointment(appointmentId, {
        status: 'cancelado'
    }, appointment.clientPhone);
}

async function adminMarkAppointmentDone(appointmentId) {
    const appointment = adminAppointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    const confirmDone = confirm('¿Marcar este turno como realizado?');
    if (!confirmDone) return;
    await updateAppointment(appointmentId, {
        status: 'realizado'
    }, null);
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

async function loadAdminUsers() {
    try {
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
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="7">No hay usuarios registrados para mostrar.</td>';
        tbody.appendChild(tr);
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
                <button type="button" onclick="adminChangeUserPoints('${user.uid}', 10)">+10</button>
                <button type="button" onclick="adminChangeUserPoints('${user.uid}', -10)">-10</button>
                <button type="button" onclick="adminToggleUserActive('${user.uid}', ${activo ? 'true' : 'false'})">${activo ? 'Desactivar' : 'Reactivar'}</button>
                <button type="button" onclick="adminResetUserPassword('${user.Email || ''}')">Resetear clave</button>
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
        await updateDoc(ref, {
            Puntos: newPoints
        });
        adminUsers = adminUsers.map(u => {
            if (u.uid === uid) {
                return { ...u, Puntos: newPoints };
            }
            return u;
        });
        renderAdminUsers();
    } catch (error) {
        console.error('Error al actualizar puntos:', error);
        alert('No se pudieron actualizar los puntos.');
    }
}

async function adminToggleUserActive(uid, active) {
    try {
        const { db, doc, updateDoc } = await import('./firebaseConfig.js');
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, {
            Activo: !active
        });
        adminUsers = adminUsers.map(u => {
            if (u.uid === uid) {
                return { ...u, Activo: !active };
            }
            return u;
        });
        renderAdminUsers();
    } catch (error) {
        console.error('Error al actualizar estado de usuario:', error);
        alert('No se pudo actualizar el estado de la cuenta.');
    }
}

async function adminResetUserPassword(email) {
    if (!email) {
        alert('Este usuario no tiene correo registrado.');
        return;
    }
    try {
        const { auth, sendPasswordResetEmail } = await import('./firebaseConfig.js');
        await sendPasswordResetEmail(auth, email);
        alert('Se envió un correo para restablecer la contraseña.');
    } catch (error) {
        console.error('Error al enviar correo de restablecimiento:', error);
        alert('No se pudo enviar el correo de restablecimiento.');
    }
}

async function adminBlockDay() {
    const input = document.getElementById('adminBlockDate');
    if (!input || !input.value) {
        alert('Selecciona una fecha para bloquear.');
        return;
    }
    const dateStr = input.value;
    try {
        const { db, doc, setDoc } = await import('./firebaseConfig.js');
        const ref = doc(db, 'blocked_days', dateStr);
        await setDoc(ref, {
            date: dateStr,
            createdAt: new Date().toISOString()
        });
        if (!blockedDates.includes(dateStr)) {
            blockedDates.push(dateStr);
        }
        renderBlockedDaysList();
        const affectedAppointments = adminAppointments.filter(a => a.date === dateStr && (a.status || 'pendiente') !== 'cancelado');
        if (affectedAppointments.length > 0) {
            const confirmNotify = confirm(`Hay ${affectedAppointments.length} turno(s) en esa fecha. ¿Quieres marcarlos como reprogramados y abrir WhatsApp para avisar a cada cliente?`);
            if (confirmNotify) {
                for (const app of affectedAppointments) {
                    await updateAppointment(app.id, { status: 'reprogramado' }, app.clientPhone);
                }
            }
        }
        alert('Día bloqueado para nuevos turnos.');
    } catch (error) {
        console.error('Error al bloquear día:', error);
        alert('No se pudo bloquear el día.');
    }
}

async function adminUnblockDay() {
    const input = document.getElementById('adminBlockDate');
    if (!input || !input.value) {
        alert('Selecciona una fecha para desbloquear.');
        return;
    }
    const dateStr = input.value;
    try {
        const { db, doc, deleteDoc } = await import('./firebaseConfig.js');
        const ref = doc(db, 'blocked_days', dateStr);
        await deleteDoc(ref);
        blockedDates = blockedDates.filter(d => d !== dateStr);
        renderBlockedDaysList();
        alert('Día desbloqueado.');
    } catch (error) {
        console.error('Error al desbloquear día:', error);
        alert('No se pudo desbloquear el día.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!isCurrentUserAdmin()) {
        alert('Acceso restringido solo para la dueña.');
        window.location.href = 'index.html';
        return;
    }
    await Promise.all([
        loadAdminAppointments(),
        loadAdminUsers(),
        refreshBlockedDatesFromFirestore()
    ]);
});

// Expose functions to window for HTML onclick events
window.showAdminSection = showAdminSection;
window.renderAdminAppointments = renderAdminAppointments;
window.renderAdminUsers = renderAdminUsers;
window.adminBlockDay = adminBlockDay;
window.adminUnblockDay = adminUnblockDay;
window.adminMarkAppointmentDone = adminMarkAppointmentDone;
window.adminRescheduleAppointment = adminRescheduleAppointment;
window.adminCancelAppointment = adminCancelAppointment;
window.adminChangeUserPoints = adminChangeUserPoints;
window.adminToggleUserActive = adminToggleUserActive;
window.adminResetUserPassword = adminResetUserPassword;
