import { services, timeSlots, monthNames, ADMIN_UID } from './data.js';
import { showToast } from './toast.js';

let currentStep = 1;
let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

let blockedDates = [];


async function openBookingModal() {
    const modal = document.getElementById('bookingModal');
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    resetModal();
    await initializeCalendar();
}

function setupBookingForm() {
    const user = getUserSession();
    const formContainer = document.querySelector('.modal-booking-form');
    const existingWarning = document.querySelector('.guest-warning');
    if (existingWarning) existingWarning.remove();

    const nameInput = document.getElementById('modalClientName');
    const phoneInput = document.getElementById('modalClientPhone');

    if (user) {
        // Logged in user: Auto-fill and lock
        if (nameInput) {
            nameInput.value = user["Nombre Completo"] || '';
            nameInput.readOnly = true;
        }
        if (phoneInput) {
            phoneInput.value = user["Numero"] || '';
            phoneInput.readOnly = true;
        }

        // Add welcome message
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'guest-warning';
        welcomeDiv.style.background = '#d4edda';
        welcomeDiv.style.color = '#155724';
        welcomeDiv.style.borderColor = '#c3e6cb';
        welcomeDiv.innerHTML = `
            <i class="fas fa-check-circle" style="color: #155724;"></i>
            <span>Reservando como <strong>${user["Nombre Completo"]}</strong></span>
        `;
        formContainer.insertBefore(welcomeDiv, formContainer.firstChild);

    } else {
        // Guest user: Allow edit and show warning
        if (nameInput) {
            nameInput.value = '';
            nameInput.readOnly = false;
        }
        if (phoneInput) {
            phoneInput.value = '';
            phoneInput.readOnly = false;
        }

        const warningDiv = document.createElement('div');
        warningDiv.className = 'guest-warning';
        warningDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>Estás reservando como invitado. Inicia sesión para sumar puntos.</span>
            <button type="button" class="guest-login-btn" onclick="openModal('loginModal')">Login</button>
        `;
        formContainer.insertBefore(warningDiv, formContainer.firstChild);
    }
}


function resetModal() {
    currentStep = 1;
    selectedService = null;
    selectedDate = null;
    selectedTime = null;


    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index === 0) step.classList.add('active');
    });


    document.querySelectorAll('.booking-step-content').forEach((content, index) => {
        content.style.display = index === 0 ? 'block' : 'none';
    });


    document.querySelectorAll('.service-modal-card').forEach(card => {
        card.classList.remove('selected');
    });

    updateNavigationButtons();


    document.getElementById('modalAppointmentForm').reset();
}

function selectModalService(serviceKey, serviceName, price, duration) {

    document.querySelectorAll('.service-modal-card').forEach(card => {
        card.classList.remove('selected');
    });

    const selectedCard = document.querySelector(`.service-modal-card[data-service="${serviceKey}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }

    selectedService = { id: serviceKey, name: serviceName, price: price, duration: duration };

    updateNavigationButtons();

    console.log("Servicio seleccionado:", serviceName, price, duration);
}


function nextModalStep() {
    if (currentStep === 1 && !selectedService) {
        showToast('Por favor selecciona un servicio', 'warning');
        return;
    }

    if (currentStep === 2 && !selectedDate) {
        showToast('Por favor selecciona una fecha', 'warning');
        return;
    }

    if (currentStep === 3 && !selectedTime) {
        showToast('Por favor selecciona una hora', 'warning');
        return;
    }

    if (currentStep < 4) {

        document.getElementById(`step${currentStep}`).classList.add('completed');
        document.getElementById(`step${currentStep}`).classList.remove('active');

        currentStep++;

        document.getElementById(`step${currentStep}`).classList.add('active');


        document.querySelectorAll('.booking-step-content').forEach((content, index) => {
            content.style.display = index === currentStep - 1 ? 'block' : 'none';
        });

        if (currentStep === 2) {
            initializeCalendar();
        } else if (currentStep === 3) {
            generateTimeSlots();
        } else if (currentStep === 4) {
            updateAppointmentSummary();
            setupBookingForm();
        }

        updateNavigationButtons();
    }
}

function previousModalStep() {
    if (currentStep > 1) {

        document.getElementById(`step${currentStep}`).classList.remove('active');

        currentStep--;

        document.getElementById(`step${currentStep}`).classList.remove('completed');
        document.getElementById(`step${currentStep}`).classList.add('active');

        document.querySelectorAll('.booking-step-content').forEach((content, index) => {
            content.style.display = index === currentStep - 1 ? 'block' : 'none';
        });

        updateNavigationButtons();
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('modalPrevBtn');
    const nextBtn = document.getElementById('modalNextBtn');
    const confirmBtn = document.getElementById('modalConfirmBtn');


    prevBtn.style.display = currentStep > 1 ? 'block' : 'none';

    if (currentStep === 4) {
        nextBtn.style.display = 'none';
        confirmBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        confirmBtn.style.display = 'none';

        let canProceed = false;
        if (currentStep === 1) canProceed = selectedService !== null;
        else if (currentStep === 2) canProceed = selectedDate !== null;
        else if (currentStep === 3) canProceed = selectedTime !== null;
        else canProceed = true;

        nextBtn.disabled = !canProceed;
        nextBtn.style.opacity = canProceed ? '1' : '0.5';
    }
}

async function initializeCalendar() {
    updateCalendarHeader();
    await refreshBlockedDatesFromFirestore();
    generateCalendarDays();
    setupCalendarNavigation();
    updateModalCalendarNavigationButtons();
}

function updateModalCalendarNavigationButtons() {
    const prevBtn = document.getElementById('modalPrevMonth');
    if (!prevBtn) return;

    const now = new Date();
    const currentRealMonth = now.getMonth();
    const currentRealYear = now.getFullYear();

    if (currentYear < currentRealYear || (currentYear === currentRealYear && currentMonth <= currentRealMonth)) {
        prevBtn.disabled = true;
        prevBtn.style.opacity = '0.3';
        prevBtn.style.cursor = 'not-allowed';
    } else {
        prevBtn.disabled = false;
        prevBtn.style.opacity = '1';
        prevBtn.style.cursor = 'pointer';
    }
}

function updateCalendarHeader() {
    document.getElementById('modalCurrentMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;
}

function generateCalendarDays() {
    const calendarDays = document.getElementById('modalCalendarDays');
    calendarDays.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    // Para empezar en Lunes (L=1, M=2..., D=0)
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


        if (date.getMonth() !== currentMonth) {
            dayElement.classList.add('other-month');
        } else if (date < today) {
            dayElement.classList.add('disabled');
        } else if (dayOfWeek === 0) {
            dayElement.classList.add('sunday');
            // Domingos siempre cerrados (futuros), sin click listener
        } else if (blockedDates.includes(dateString)) {
            dayElement.classList.add('occupied');
        } else {
            dayElement.addEventListener('click', () => selectDate(date));
        }


        if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
            dayElement.classList.add('selected');
        }

        calendarDays.appendChild(dayElement);
    }
}

function setupCalendarNavigation() {
    const prevBtn = document.getElementById('modalPrevMonth');
    const nextBtn = document.getElementById('modalNextMonth');

    if (prevBtn) {
        prevBtn.onclick = () => {
            const now = new Date();
            const currentRealMonth = now.getMonth();
            const currentRealYear = now.getFullYear();

            // Evitar volver atrás si estamos en el mes actual
            if (currentYear === currentRealYear && currentMonth === currentRealMonth) {
                return;
            }

            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            updateCalendarHeader();
            generateCalendarDays();
            updateModalCalendarNavigationButtons();
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            updateCalendarHeader();
            generateCalendarDays();
            updateModalCalendarNavigationButtons();
        };
    }
}

function selectDate(date) {
    selectedDate = date;
    selectedTime = null;


    document.querySelectorAll('.modal-calendar-day').forEach(day => {
        day.classList.remove('selected');
    });

    event.target.classList.add('selected');


    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('modalSelectedDate').textContent = date.toLocaleDateString('es-ES', options);

    updateNavigationButtons();
}



async function generateTimeSlots() {
    const timeSlotsContainer = document.getElementById('modalTimeSlots');
    timeSlotsContainer.innerHTML = '<p>Cargando horarios disponibles...</p>';

    if (!selectedDate) return;

    const dateString = selectedDate.toISOString().split('T')[0];

    try {
        const { db, collection, query, where, getDocs } = await import('./firebaseConfig.js');
        const q = query(
            collection(db, 'appointments'),
            where('date', '==', dateString)
        );

        const querySnapshot = await getDocs(q);
        const occupiedTimes = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.status !== 'cancelado') {
                occupiedTimes.push(data.time);
            }
        });

        timeSlotsContainer.innerHTML = '';
        timeSlots.forEach(time => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = time;

            if (occupiedTimes.includes(time)) {
                timeSlot.classList.add('occupied');
                timeSlot.title = "No disponible";
                timeSlot.style.backgroundColor = "#ffebee";
                timeSlot.style.color = "#c62828";
                timeSlot.style.cursor = "not-allowed";
            } else {
                timeSlot.addEventListener('click', () => selectTime(time, timeSlot));
            }

            timeSlotsContainer.appendChild(timeSlot);
        });

    } catch (error) {
        console.error("Error al cargar horarios:", error);
        timeSlotsContainer.innerHTML = '<p>Error al cargar horarios. Intenta de nuevo.</p>';
    }
}

function selectTime(time, element) {
    selectedTime = time;


    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });

    element.classList.add('selected');
    updateNavigationButtons();
}



function updateAppointmentSummary() {
    if (!selectedService || !selectedDate || !selectedTime) return;

    document.getElementById('modalSummaryService').textContent = selectedService.name;

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('modalSummaryDate').textContent = selectedDate.toLocaleDateString('es-ES', dateOptions);

    document.getElementById('modalSummaryTime').textContent = selectedTime;
    document.getElementById('modalSummaryDuration').textContent = selectedService.duration;
    document.getElementById('modalSummaryPrice').textContent = `$${selectedService.price.toLocaleString()}`;
}



async function confirmModalAppointment() {
    const form = document.getElementById('modalAppointmentForm');
    const formData = new FormData(form);

    const name = formData.get('modalClientName');
    const phone = formData.get('modalClientPhone');
    const notes = formData.get('modalNotes');

    if (!name || !phone) {
        showToast('Por favor completa todos los campos obligatorios', 'warning');
        return;
    }


    const appointment = {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        serviceDuration: selectedService.duration,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        status: 'pendiente',
        clientName: name,
        clientPhone: phone,
        clientNotes: notes,
        createdAt: new Date().toISOString()
    };

    try {
        const sessionUser = getUserSession();
        if (sessionUser && sessionUser.uid) {
            appointment.userUid = sessionUser.uid;
            appointment.userName = sessionUser["Nombre Completo"] || null;
        }
        const { db, collection, addDoc } = await import('./firebaseConfig.js');
        const colRef = collection(db, 'appointments');
        await addDoc(colRef, appointment);
    } catch (error) {
        console.error('Error al guardar la cita en Firestore:', error);
    }

    // showToast(`¡Cita confirmada! Te contactaremos por WhatsApp para confirmar los detalles.`, 'success', 5000);
    closeModal('bookingModal');
}

document.addEventListener('DOMContentLoaded', function () {

    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();

    document.getElementById('bookingModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal('bookingModal');
        }
    });

    document.querySelector('.modal-content').addEventListener('click', function (e) {
        e.stopPropagation();
    });
});

function formatPrice(price) {
    return `$${price.toLocaleString()}`;
}

function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} min`;
    } else {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
}

function validatePhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.length >= 8;
}

document.addEventListener('DOMContentLoaded', function () {
    const phoneInput = document.getElementById('modalClientPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function () {
            const isValid = validatePhone(this.value);
            this.style.borderColor = isValid ? 'var(--success-color)' : 'var(--error-color)';
        });
    }
});


function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        if (modalId === 'loginModal') {
            const currentUser = getUserSession();

            if (currentUser) {
                document.getElementById('loginSection').style.display = 'none';
                document.getElementById('userDashboard').style.display = 'block';
                showUserDashboard(currentUser);
            } else {
                document.getElementById('loginSection').style.display = 'block';
                document.getElementById('userDashboard').style.display = 'none';
                showRegisterForm();
            }
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        if (modalId === 'serviceGalleryModal') {
            currentGalleryServiceKey = null;
            galleryImages = [];
        }
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function showRegisterForm() {
    document.getElementById('registerFields').style.display = 'block';
    document.getElementById('registerToggle').classList.add('active');
    document.getElementById('loginToggle').classList.remove('active');
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-user-plus"></i> Crear Mi Perfil';
    document.getElementById('welcomeTitle').textContent = '¡Bienvenida a Sbsofinails!';
    document.getElementById('welcomeText').textContent = 'Ingresa tus datos para acceder a tu perfil y disfrutar de nuestro programa de fidelidad';
}

function showLoginForm() {
    document.getElementById('registerFields').style.display = 'none';
    document.getElementById('loginToggle').classList.add('active');
    document.getElementById('registerToggle').classList.remove('active');
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
    document.getElementById('welcomeTitle').textContent = '¡Bienvenida de vuelta!';
    document.getElementById('welcomeText').textContent = 'Ingresa tus datos para acceder a tu cuenta';
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(inputId + 'ToggleIcon');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Manejar envío del formulario (actualizado con base de datos)
document.addEventListener('DOMContentLoaded', function () {
    // Verificar si hay una sesión activa al cargar la página
    const currentUser = getUserSession();
    if (currentUser) {
        const accountLabel = document.querySelector('.btn-account-label');
        if (accountLabel) {
            const userName = currentUser.NombreCompleto || currentUser["Nombre Completo"] || "Mi Cuenta";
            accountLabel.textContent = userName.split(' ')[0];
        }
        // Pre-cargar dashboard para que esté listo al abrir el modal
        showUserDashboard(currentUser);
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const isRegister = document.getElementById('registerToggle').classList.contains('active');
            const isEditMode = loginForm.classList.contains('edit-mode');
            const phone = document.getElementById('loginPhone').value.trim();
            const password = document.getElementById('loginPassword').value;

            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            submitBtn.disabled = true;

            try {
                const name = document.getElementById('loginName').value.trim();
                if (isRegister && !isEditMode) {
                    const confirmPassword = document.getElementById('confirmPassword').value;
                    const acceptTerms = document.getElementById('acceptTerms').checked;
                    const birthday = document.getElementById('loginBirthday').value;

                    if (password !== confirmPassword) {
                        showToast('Las contraseñas no coinciden', 'error');
                        return;
                    }

                    if (!acceptTerms) {
                        showToast('Debes aceptar los términos y condiciones', 'warning');
                        return;
                    }

                    if (password.length < 5) {
                        showToast('La contraseña debe tener al menos 5 caracteres', 'warning');
                        return;
                    }

                    if (!phone) {
                        showToast('El número de WhatsApp es obligatorio', 'warning');
                        return;
                    }

                    if (!name) {
                        showToast('El nombre es obligatorio', 'warning');
                        return;
                    }

                    const userExists = await checkUserExists(name);
                    if (userExists) {
                        showToast('Ya existe una cuenta con este nombre', 'error');
                        return;
                    }

                    const internalEmail = generateInternalEmailFromName(name);

                    const registerResult = await registerUser({
                        name: name,
                        email: internalEmail,
                        phone: phone,
                        password: password,
                        birthday: birthday
                    });

                    if (registerResult.success) {
                        saveUserSession(registerResult.user);
                        showUserDashboard(registerResult.user);
                        closeModal('loginModal');
                    } else {
                        showToast(`Error al registrar: ${registerResult.error}`, 'error');
                    }

                } else if (isEditMode) {
                    showToast('Función de editar perfil - próximamente disponible', 'info');

                } else {
                    if (!name) {
                        showToast('El nombre es obligatorio', 'warning');
                        return;
                    }
                    const loginResult = await loginByName(name, password);

                    if (loginResult.success) {
                        saveUserSession(loginResult.user);
                        showUserDashboard(loginResult.user);
                        closeModal('loginModal');
                    } else {
                        showToast(`Error al iniciar sesión: ${loginResult.error}`, 'error');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('Error de conexión. Por favor, intenta nuevamente.', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                loginForm.classList.remove('edit-mode');
            }
        });
    }
});

function openEditProfileModal() {
    const user = getUserSession();
    if (!user) {
        showToast('Debes iniciar sesión para editar tu perfil.', 'error');
        return;
    }

    const nameInput = document.getElementById('editName');
    const phoneInput = document.getElementById('editPhone');
    const birthdayInput = document.getElementById('editBirthday');

    if (nameInput) nameInput.value = user["Nombre Completo"] || '';
    if (phoneInput) phoneInput.value = user["Numero"] || '';
    if (birthdayInput) birthdayInput.value = (user["Fecha de Cumpleaños"] && user["Fecha de Cumpleaños"] !== 'none') ? user["Fecha de Cumpleaños"] : '';

    closeModal('loginModal');
    openModal('editProfileModal');
}

async function saveProfile(event) {
    event.preventDefault();
    const user = getUserSession();
    if (!user) return;

    const name = document.getElementById('editName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const birthday = document.getElementById('editBirthday').value;

    try {
        const { auth, db, doc, updateDoc, updateEmail } = await import('./firebaseConfig.js');
        const userRef = doc(db, 'users', user.uid);
        const updates = {
            NombreCompleto: name,
            Numero: phone,
            FechaCumpleanos: birthday || 'none'
        };

        // Si el usuario usa un mail interno (.local), intentamos actualizarlo también
        // para que pueda seguir entrando con su nuevo nombre
        if (user.Email && user.Email.endsWith('@sbsofinails.local')) {
            const newEmail = generateInternalEmailFromName(name);
            if (newEmail !== user.Email) {
                try {
                    if (auth.currentUser) {
                        await updateEmail(auth.currentUser, newEmail);
                        updates.Email = newEmail;
                        user.Email = newEmail;
                        console.log('Email interno actualizado a:', newEmail);
                    }
                } catch (emailError) {
                    console.error('Error al actualizar email de Auth:', emailError);
                    // Si falla por sesión antigua, no bloqueamos el guardado del resto de datos
                    if (emailError.code === 'auth/requires-recent-login') {
                        showToast('Para cambiar tu nombre de acceso, debes haber iniciado sesión recientemente.', 'warning');
                    }
                }
            }
        }

        await updateDoc(userRef, updates);

        // Actualizar sesión local
        user["Nombre Completo"] = name;
        user["Numero"] = phone;
        user["Fecha de Cumpleaños"] = birthday || 'none';
        saveUserSession(user);

        // Actualizar IU
        showUserDashboard(user);

        closeEditProfile();
        showToast('Perfil actualizado correctamente', 'success');

    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        showToast('Error al actualizar perfil', 'error');
    }
}

function editProfile() {
    openEditProfileModal();
}

function closeEditProfile() {
    closeModal('editProfileModal');
    openModal('loginModal');
}

document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('editProfileForm');
    if (editForm) {
        editForm.addEventListener('submit', saveProfile);
    }

    const editModal = document.getElementById('editProfileModal');
    if (editModal) {
        editModal.addEventListener('click', function (e) {
            if (e.target === this) {
                closeEditProfile();
            }
        });
    }
});

function showSection(section) {
    const dashboard = document.getElementById('userDashboard');
    const sectionApps = document.getElementById('sectionAppointments');
    const sectionRew = document.getElementById('sectionRewards');
    const sectionNotif = document.getElementById('sectionNotifications');

    // Ocultar todo primero
    dashboard.style.display = 'none';
    sectionApps.style.display = 'none';
    sectionRew.style.display = 'none';
    sectionNotif.style.display = 'none';

    if (section === 'appointments') {
        sectionApps.style.display = 'block';
        loadUserAppointments();
    } else if (section === 'rewards') {
        sectionRew.style.display = 'block';
        loadUserRewards();
    } else if (section === 'notifications') {
        sectionNotif.style.display = 'block';
        loadUserNotifications();
    } else {
        dashboard.style.display = 'block';
    }
}

function hideSubSection() {
    showSection('dashboard');
}

async function loadUserAppointments() {
    const user = getUserSession();
    if (!user) return;

    const listContainer = document.getElementById('appointmentsList');
    listContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando tus citas...</div>';

    try {
        const { db, collection, query, where, getDocs, orderBy } = await import('./firebaseConfig.js');
        const appointmentsRef = collection(db, 'appointments');
        // Intentamos ordenar por fecha, si falla por falta de índice, ordenamos en memoria
        let q;
        try {
            q = query(appointmentsRef, where('userId', '==', user.uid), orderBy('date', 'desc'));
            const querySnapshot = await getDocs(q);
            renderAppointmentsList(querySnapshot);
        } catch (indexError) {
            console.warn("Falta índice para orderBy, filtrando en memoria");
            q = query(appointmentsRef, where('userId', '==', user.uid));
            const querySnapshot = await getDocs(q);
            renderAppointmentsList(querySnapshot, true); // true para ordenar en memoria
        }
    } catch (error) {
        console.error("Error al cargar citas:", error);
        listContainer.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error al cargar tus citas.</p></div>';
    }
}

function renderAppointmentsList(querySnapshot, sortInMemory = false) {
    const listContainer = document.getElementById('appointmentsList');
    let appointments = [];

    querySnapshot.forEach((doc) => {
        appointments.push({ id: doc.id, ...doc.data() });
    });

    if (sortInMemory) {
        appointments.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    if (appointments.length === 0) {
        listContainer.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-minus"></i><p>Aún no tienes ninguna cita agendada.</p></div>';
        return;
    }

    listContainer.innerHTML = appointments.map(app => {
        const statusClass = `status-${app.status || 'pendiente'}`;
        const statusText = (app.status || 'pendiente').charAt(0).toUpperCase() + (app.status || 'pendiente').slice(1);

        return `
            <div class="appointment-item">
                <div class="appointment-info">
                    <h5>${app.serviceName}</h5>
                    <p><i class="far fa-calendar"></i> ${app.date}</p>
                    <p><i class="far fa-clock"></i> ${app.time} hs</p>
                </div>
                <div class="appointment-status ${statusClass}">${statusText}</div>
            </div>
        `;
    }).join('');
}

function loadUserRewards() {
    const user = getUserSession();
    if (!user) return;

    const points = parseInt(user.Puntos) || 0;
    const listContainer = document.getElementById('rewardsList');

    const possibleRewards = [
        { id: 1, name: '10% de Descuento', points: 100, icon: 'fa-percent', desc: 'Válido para cualquier servicio de manicuría.' },
        { id: 2, name: 'Diseño Simple Gratis', points: 200, icon: 'fa-paint-brush', desc: 'Decoración simple en dos uñas de regalo.' },
        { id: 3, name: '20% de Descuento', points: 350, icon: 'fa-tag', desc: 'Válido para servicios combinados.' },
        { id: 4, name: 'Servicio de SPA de Manos', points: 500, icon: 'fa-hands', desc: 'Exfoliación e hidratación profunda gratis.' }
    ];

    listContainer.innerHTML = possibleRewards.map(reward => {
        const isAvailable = points >= reward.points;
        const stateClass = isAvailable ? 'available' : 'locked';

        return `
            <div class="reward-item ${stateClass}">
                <div class="reward-icon">
                    <i class="fas ${isAvailable ? reward.icon : 'fa-lock'}"></i>
                </div>
                <div class="reward-content">
                    <h5>${reward.name}</h5>
                    <p>${reward.desc}</p>
                </div>
                <div class="reward-points">${reward.points} Pts</div>
            </div>
        `;
    }).join('');
}

async function loadUserNotifications() {
    const user = getUserSession();
    if (!user) return;

    const listContainer = document.getElementById('notificationsList');
    listContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando notificaciones...</div>';

    try {
        const { db, collection, query, where, getDocs, orderBy } = await import('./firebaseConfig.js');
        const notifRef = collection(db, 'notifications');

        let q;
        try {
            q = query(notifRef, where('userId', '==', user.uid), orderBy('timestamp', 'desc'));
            const snapshot = await getDocs(q);
            renderNotificationsList(snapshot);
        } catch (indexError) {
            console.warn("Falta índice para notificaciones, filtrando en memoria");
            q = query(notifRef, where('userId', '==', user.uid));
            const snapshot = await getDocs(q);
            renderNotificationsList(snapshot, true);
        }
    } catch (error) {
        console.error("Error al cargar notificaciones:", error);
        listContainer.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error al cargar notificaciones.</p></div>';
    }
}

function renderNotificationsList(snapshot, sortInMemory = false) {
    const listContainer = document.getElementById('notificationsList');
    let notifications = [];

    snapshot.forEach(docSnap => {
        notifications.push({ id: docSnap.id, ...docSnap.data() });
    });

    if (sortInMemory) {
        notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    if (notifications.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <p>No tienes notificaciones nuevas.</p>
            </div>
            <div class="notification-item">
                <h5>¡Bienvenida!</h5>
                <p>Gracias por elegir Sbsofinails. Aquí verás avisos sobre tus citas y promociones.</p>
                <span class="time">Sistema</span>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = notifications.map(notif => {
        const date = notif.timestamp ? new Date(notif.timestamp).toLocaleString() : 'Reciente';
        return `
            <div class="notification-item">
                <h5>${notif.title}</h5>
                <p>${notif.text}</p>
                <span class="time">${date}</span>
            </div>
        `;
    }).join('');
}

window.addEventListener('click', function (event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        closeModal('loginModal');
    }
});




let currentGalleryServiceKey = null;
let currentImageIndex = 0;
let galleryImages = [];

// Abre la galería con efecto carrusel 3D
function openServiceGallery(serviceKey, serviceName) {
    currentGalleryServiceKey = serviceKey;
    currentImageIndex = 0;

    // Updated to use services from data.js
    const service = services[serviceKey];
    if (!service) return;

    galleryImages = service.images;

    // Actualizar título
    const titleEl = document.getElementById('galleryServiceTitle');
    if (titleEl) titleEl.textContent = `Galería - ${serviceName}`;

    // Generar carrusel
    generateCarousel();

    // Mostrar modal
    openModal('serviceGalleryModal');
}

// Genera el carrusel 3D con las imágenes
function generateCarousel() {
    const carousel = document.getElementById('carousel3D');
    const indicators = document.getElementById('galleryIndicators');
    const currentNumber = document.getElementById('currentImageNumber');
    const totalNumber = document.getElementById('totalImages');

    if (!carousel || !indicators) return;

    // Limpiar contenido anterior
    carousel.innerHTML = '';
    indicators.innerHTML = '';

    if (galleryImages.length === 0) {
        // Crear imágenes placeholder para mostrar el efecto
        const placeholderImages = [
            { name: 'Imagen 1', color: '#ff69b4' },
            { name: 'Imagen 2', color: '#ff1493' },
            { name: 'Imagen 3', color: '#ff69b4' },
            { name: 'Imagen 4', color: '#ff1493' },
            { name: 'Imagen 5', color: '#ff69b4' }
        ];

        placeholderImages.forEach((placeholder, index) => {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'carousel-image';
            if (index === 0) imageContainer.classList.add('active');

            imageContainer.innerHTML = `
                <div style="
                    width: 100%; 
                    height: 100%; 
                    background: linear-gradient(135deg, ${placeholder.color}20, ${placeholder.color}10);
                    display: flex; 
                    flex-direction: column;
                    align-items: center; 
                    justify-content: center; 
                    color: #666;
                    border-radius: 11px;
                    border: 2px dashed ${placeholder.color}40;
                ">
                    <i class="fas fa-image" style="font-size: 3rem; margin-bottom: 1rem; color: ${placeholder.color}60;"></i>
                    <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">${placeholder.name}</div>
                    <div style="font-size: 0.9rem; opacity: 0.7;">Próximamente</div>
                </div>
            `;

            carousel.appendChild(imageContainer);

            // Crear indicador
            const indicator = document.createElement('button');
            indicator.className = 'gallery-indicator';
            if (index === 0) indicator.classList.add('active');
            indicator.onclick = () => goToPlaceholderImage(index);
            indicators.appendChild(indicator);
        });

        return;
    } else {
        // Crear imágenes reales
        galleryImages.forEach((imageSrc, index) => {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'carousel-image';
            if (index === 0) imageContainer.classList.add('active');

            const img = document.createElement('img');
            img.src = imageSrc;
            // Updated to use services from data.js
            img.alt = `${services[currentGalleryServiceKey].name} ${index + 1}`;

            img.onerror = function () {
                this.parentElement.innerHTML = `
                    <div style="
                        width: 100%; 
                        height: 100%; 
                        background: linear-gradient(135deg, #ff69b420, #ff69b410);
                        display: flex; 
                        flex-direction: column;
                        align-items: center; 
                        justify-content: center; 
                        color: #666;
                        border-radius: 11px;
                        border: 2px dashed #ff69b440;
                    ">
                        <i class="fas fa-image" style="font-size: 2.5rem; margin-bottom: 1rem; color: #ff69b460;"></i>
                        <div style="font-size: 1rem; font-weight: 600;">Imagen ${index + 1}</div>
                        <div style="font-size: 0.8rem; opacity: 0.7;">No disponible</div>
                    </div>
                `;
            };

            imageContainer.appendChild(img);
            carousel.appendChild(imageContainer);

            // Crear indicador
            const indicator = document.createElement('button');
            indicator.className = 'gallery-indicator';
            if (index === 0) indicator.classList.add('active');
            indicator.onclick = () => goToImage(index);
            indicators.appendChild(indicator);
        });
    }

    // Actualizar contador
    if (currentNumber) currentNumber.textContent = '1';
    if (totalNumber) totalNumber.textContent = galleryImages.length.toString();

    // Posicionar imágenes inicialmente
    updateCarouselPositions();
}

function updateCarouselPositions() {
    const images = document.querySelectorAll('#carousel3D .carousel-image');
    const indicators = document.querySelectorAll('.gallery-indicator');
    const currentNumber = document.getElementById('currentImageNumber');

    if (images.length === 0) return;

    const totalImages = images.length;

    images.forEach((img, index) => {
        img.classList.remove('active');

        // Calcular posición relativa circular
        let relativeIndex = index - currentImageIndex;
        if (relativeIndex < 0) relativeIndex += totalImages;
        if (relativeIndex >= totalImages) relativeIndex -= totalImages;

        let transform = '';
        let zIndex = 1;
        let opacity = 0.4;
        let scale = 0.7;

        if (relativeIndex === 0) {
            // Imagen central (activa)
            transform = 'translateX(0) translateZ(80px) rotateY(0deg) scale(1.1)';
            zIndex = 10;
            opacity = 1;
            scale = 1.1;
            img.classList.add('active');
        } else if (relativeIndex === 1) {
            // Primera imagen derecha
            transform = 'translateX(200px) translateZ(-20px) rotateY(-35deg) scale(0.9)';
            zIndex = 8;
            opacity = 0.8;
            scale = 0.9;
        } else if (relativeIndex === totalImages - 1) {
            // Primera imagen izquierda (última en el array)
            transform = 'translateX(-200px) translateZ(-20px) rotateY(35deg) scale(0.9)';
            zIndex = 8;
            opacity = 0.8;
            scale = 0.9;
        } else if (relativeIndex === 2) {
            // Segunda imagen derecha
            transform = 'translateX(320px) translateZ(-80px) rotateY(-55deg) scale(0.75)';
            zIndex = 6;
            opacity = 0.6;
            scale = 0.75;
        } else if (relativeIndex === totalImages - 2) {
            // Segunda imagen izquierda
            transform = 'translateX(-320px) translateZ(-80px) rotateY(55deg) scale(0.75)';
            zIndex = 6;
            opacity = 0.6;
            scale = 0.75;
        } else if (relativeIndex <= Math.floor(totalImages / 2)) {
            // Imágenes del lado derecho (más lejanas)
            const distance = 400 + (relativeIndex - 2) * 60;
            const rotation = -70 - (relativeIndex - 2) * 10;
            const scaleValue = Math.max(0.5, 0.75 - (relativeIndex - 2) * 0.1);
            transform = `translateX(${distance}px) translateZ(-120px) rotateY(${rotation}deg) scale(${scaleValue})`;
            zIndex = Math.max(1, 6 - relativeIndex);
            opacity = Math.max(0.3, 0.6 - (relativeIndex - 2) * 0.1);
        } else {
            // Imágenes del lado izquierdo (más lejanas)
            const leftIndex = totalImages - relativeIndex;
            const distance = -400 - (leftIndex - 2) * 60;
            const rotation = 70 + (leftIndex - 2) * 10;
            const scaleValue = Math.max(0.5, 0.75 - (leftIndex - 2) * 0.1);
            transform = `translateX(${distance}px) translateZ(-120px) rotateY(${rotation}deg) scale(${scaleValue})`;
            zIndex = Math.max(1, 6 - leftIndex);
            opacity = Math.max(0.3, 0.6 - (leftIndex - 2) * 0.1);
        }

        img.style.transform = transform;
        img.style.zIndex = zIndex;
        img.style.opacity = opacity;

        // Efecto hover mejorado
        img.onmouseenter = () => {
            if (!img.classList.contains('active')) {
                const currentScale = scale * 1.05;
                img.style.transform = transform.replace(/scale\([^)]*\)/, `scale(${currentScale})`);
                img.style.opacity = Math.min(opacity * 1.3, 1);
            }
        };

        img.onmouseleave = () => {
            if (!img.classList.contains('active')) {
                img.style.transform = transform;
                img.style.opacity = opacity;
            }
        };

        // Clic para navegar
        img.onclick = () => {
            if (index !== currentImageIndex) {
                goToImage(index);
            }
        };
    });

    // Actualizar indicadores
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentImageIndex);
    });

    // Actualizar contador
    if (currentNumber) {
        currentNumber.textContent = (currentImageIndex + 1).toString();
    }
}

// Navegar a la imagen anterior (circular)
function previousImage() {
    if (galleryImages.length === 0) return;

    // Navegación circular hacia atrás
    currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : galleryImages.length - 1;
    updateCarouselPositions();
}

// Navegar a la siguiente imagen (circular)
function nextImage() {
    if (galleryImages.length === 0) return;

    // Navegación circular hacia adelante
    currentImageIndex = currentImageIndex < galleryImages.length - 1 ? currentImageIndex + 1 : 0;
    updateCarouselPositions();
}

// Ir a una imagen específica con animación suave circular
function goToImage(targetIndex) {
    if (targetIndex >= 0 && targetIndex < galleryImages.length && targetIndex !== currentImageIndex) {
        const totalImages = galleryImages.length;

        // Calcular la ruta más corta (circular)
        let forwardSteps = targetIndex - currentImageIndex;
        if (forwardSteps < 0) forwardSteps += totalImages;

        let backwardSteps = currentImageIndex - targetIndex;
        if (backwardSteps < 0) backwardSteps += totalImages;

        // Elegir la dirección más corta
        const useForward = forwardSteps <= backwardSteps;
        const steps = useForward ? forwardSteps : backwardSteps;
        const direction = useForward ? 1 : -1;

        let step = 0;
        const animate = () => {
            if (step < steps) {
                currentImageIndex += direction;

                // Manejar wrap-around circular
                if (currentImageIndex < 0) currentImageIndex = totalImages - 1;
                if (currentImageIndex >= totalImages) currentImageIndex = 0;

                updateCarouselPositions();
                step++;
                setTimeout(animate, 200); // Pausa entre pasos
            }
        };

        animate();
    }
}


// Generar el carrusel con efectos mejorados
// DUPLICATE FUNCTION REMOVED (generateCarousel was already defined above)

// Función para navegar en placeholder (circular)
function goToPlaceholderImage(index) {
    goToImage(index);
}


// Reservar servicio desde la galería
function bookServiceFromGallery() {
    if (!currentGalleryServiceKey) return;

    // Updated to use services from data.js
    const service = services[currentGalleryServiceKey];
    if (!service) return;

    // Cerrar galería
    closeModal('serviceGalleryModal');

    // Abrir modal de reserva
    openBookingModal();

    // Preseleccionar el servicio
    selectModalService(currentGalleryServiceKey, service.name, service.price, service.duration);
}

async function registerUser(userData) {
    try {
        console.log('Registro Firebase para:', userData);
        const {
            auth,
            db,
            createUserWithEmailAndPassword,
            doc,
            setDoc
        } = await import('./firebaseConfig.js');

        const credential = await createUserWithEmailAndPassword(
            auth,
            userData.email,
            userData.password
        );

        const uid = credential.user.uid;

        const userDocRef = doc(db, 'users', uid);
        await setDoc(userDocRef, {
            uid: uid,
            Email: userData.email,
            Numero: userData.phone,
            NombreCompleto: userData.name,
            FechaCumpleanos: userData.birthday || 'none',
            Puntos: 0,
            Visitas: 0,
            CreadoEn: new Date().toISOString()
        });

        // Guardar sesión local antes de pedir notis
        saveUserSession({
            uid: uid,
            Email: userData.email,
            Numero: userData.phone,
            NombreCompleto: userData.name,
            FechaCumpleanos: userData.birthday || 'none',
            Puntos: 0,
            Visitas: 0
        });

        // Intentar activar notificaciones
        initNotifications();

        return {
            success: true,
            user: {
                uid: uid,
                Email: userData.email,
                Numero: userData.phone,
                NombreCompleto: userData.name,
                FechaCumpleanos: userData.birthday || 'none',
                Puntos: 0,
                Visitas: 0
            }
        };
    } catch (error) {
        console.error('Error en registerUser:', error);
        let message = 'Error al registrar.';
        if (error && error.code === 'auth/email-already-in-use') {
            message = 'Ya existe una cuenta con este correo electrónico.';
        }
        return {
            success: false,
            error: message
        };
    }
}

async function loginByName(name, password) {
    const email = generateInternalEmailFromName(name);
    const result = await loginUser(email, password);
    if (result.success) {
        if (!result.user.NombreCompleto || result.user.NombreCompleto === 'Usuario') {
            result.user.NombreCompleto = name;
        }
        // Iniciar notificaciones tras login exitoso
        initNotifications();
    }
    return result;
}

// --- Sistema de Notificaciones Firebase ---

const VAPID_KEY = "BHyoQdw2Iny5Vgq8lsrcCtGdjoooKUH-OPKJ8LIgEfCYpjUQPk6ygf5E1PHQ9n4DzaOjnFM6usaF31_G3jIGc3s";

async function initNotifications() {
    try {
        const { messaging, getToken, onMessage } = await import('./firebaseConfig.js');

        // Solicitar permiso
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Permiso de notificaciones concedido.');

            // Obtener Token
            const token = await getToken(messaging, { vapidKey: VAPID_KEY });
            if (token) {
                console.log('Token FCM obtenido:', token);
                await syncUserToken(token);
            }

            // Listener para mensajes con la app abierta
            onMessage(messaging, (payload) => {
                console.log('Mensaje en primer plano recibido:', payload);
                showToast(payload.notification.title + ": " + payload.notification.body, 'info');
                // Recargar bandeja de entrada si existe
                if (typeof loadUserNotifications === 'function') loadUserNotifications();
            });

        } else {
            console.log('Permiso de notificaciones denegado.');
        }
    } catch (error) {
        console.error('Error al inicializar notificaciones:', error);
    }
}

async function syncUserToken(token) {
    const user = getUserSession();
    if (!user || !user.uid) return;

    try {
        const { db, doc, updateDoc } = await import('./firebaseConfig.js');
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            fcmToken: token,
            lastTokenUpdate: new Date().toISOString()
        });
        console.log('Token sincronizado con la cuenta del usuario.');
    } catch (error) {
        console.error('Error al sincronizar token:', error);
    }
}

async function sendNotification(userId, title, text) {
    if (!userId) return;
    try {
        const { db, collection, addDoc } = await import('./firebaseConfig.js');
        await addDoc(collection(db, 'notifications'), {
            userId: userId,
            title: title,
            text: text,
            timestamp: new Date().toISOString(),
            read: false
        });
        console.log(`Notificación guardada para el usuario ${userId}: ${title}`);
    } catch (error) {
        console.error('Error al guardar notificación:', error);
    }
}

window.sendNotification = sendNotification;

async function loginUser(email, password) {
    console.log('Login Firebase para email:', email);
    const {
        auth,
        db,
        signInWithEmailAndPassword,
        doc,
        getDoc
    } = await import('./firebaseConfig.js');

    try {
        const credential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        const uid = credential.user.uid;

        let userData = {
            uid: uid,
            Email: email,
            Numero: '',
            NombreCompleto: credential.user.displayName || 'Usuario',
            FechaCumpleanos: 'none',
            Puntos: 0,
            Visitas: 0
        };

        const canUseFirestore = typeof navigator === 'undefined' ? true : navigator.onLine;
        if (canUseFirestore) {
            try {
                const userDocRef = doc(db, 'users', uid);
                const snapshot = await getDoc(userDocRef);

                if (snapshot.exists()) {
                    const data = snapshot.data();
                    userData = {
                        uid: uid,
                        Email: data.Email || email,
                        Numero: data.Numero || '',
                        NombreCompleto: data.NombreCompleto || userData.NombreCompleto,
                        FechaCumpleanos: data.FechaCumpleanos || userData.FechaCumpleanos,
                        Puntos: data.Puntos || 0,
                        Visitas: data.Visitas || 0
                    };
                } else {
                    const userDocRefNew = doc(db, 'users', uid);
                    await setDoc(userDocRefNew, {
                        uid: uid,
                        Email: userData.Email,
                        Numero: userData.Numero,
                        NombreCompleto: userData.NombreCompleto,
                        FechaCumpleanos: userData.FechaCumpleanos,
                        Puntos: userData.Puntos,
                        Visitas: userData.Visitas,
                        CreadoEn: new Date().toISOString()
                    });
                }
            } catch (firestoreError) {
                console.error('Error al leer/escribir Firestore en loginUser (se continúa con datos básicos):', firestoreError);
            }
        }

        return {
            success: true,
            user: {
                uid: userData.uid,
                Email: userData.Email,
                Numero: userData.Numero,
                NombreCompleto: userData.NombreCompleto,
                FechaCumpleanos: userData.FechaCumpleanos,
                Puntos: userData.Puntos,
                Visitas: userData.Visitas
            }
        };
    } catch (error) {
        console.error('Error en loginUser:', error);
        let message = 'Error al iniciar sesión.';
        if (error && error.code === 'auth/invalid-credential') {
            message = 'Datos de acceso incorrectos.';
        }
        return {
            success: false,
            error: message
        };
    }
}

async function checkUserExists(phone) {
    console.log('checkUserExists usa validación de Firebase en registerUser para detectar duplicados');
    return false;
}

function generateInternalEmailFromName(name) {
    const base = name.toLowerCase()
        .trim()
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9.]/g, '');
    const safeBase = base || 'usuario';
    return safeBase + '@sbsofinails.local';
}



// Funciones para manejar el estado de sesión
function saveUserSession(user) {
    localStorage.setItem('sbsofinails_user', JSON.stringify(user));
}

function getUserSession() {
    try {
        const userStr = localStorage.getItem('sbsofinails_user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error("Error parsing user session:", e);
        localStorage.removeItem('sbsofinails_user');
        return null;
    }
}

function clearUserSession() {
    localStorage.removeItem('sbsofinails_user');
}

function showUserDashboard(user) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('userDashboard').style.display = 'block';

    // Intentar activar notificaciones (pedir permiso) si no se hizo
    initNotifications();

    // Asegurar que las sub-secciones estén ocultas al volver al dashboard
    const subSections = ['sectionAppointments', 'sectionRewards', 'sectionNotifications'];
    subSections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const name = user.NombreCompleto || user["Nombre Completo"] || 'Usuario';
    document.getElementById('dashboardUserName').textContent = `¡Hola, ${name}!`;

    const accountLabel = document.querySelector('.btn-account-label');
    if (accountLabel) {
        accountLabel.textContent = name.split(' ')[0];
    }


    const points = parseInt(user.Puntos) || 0;
    let level = 'Miembro Nuevo';
    if (points >= 100) level = 'Miembro Oro';
    else if (points >= 50) level = 'Miembro Plata';
    else if (points >= 20) level = 'Miembro Bronce';

    document.getElementById('dashboardUserLevel').textContent = level;
    document.getElementById('dashboardPoints').textContent = points;
    document.getElementById('totalVisits').textContent = user.Visitas || 0;
    document.getElementById('rewardsEarned').textContent = user.Recompensas || 0;

    let nextLevelPoints = 20;
    if (points >= 50) nextLevelPoints = 100;
    else if (points >= 20) nextLevelPoints = 50;

    const progressPercent = Math.min((points / nextLevelPoints) * 100, 100);
    document.getElementById('loyaltyProgress').style.width = `${progressPercent}%`;

    const pointsNeeded = Math.max(0, nextLevelPoints - points);
    document.getElementById('progressText').textContent =
        pointsNeeded > 0 ? `${pointsNeeded} puntos para el próximo nivel` : '¡Nivel máximo alcanzado!';



    const adminPanelBtn = document.getElementById('adminPanelBtn');
    if (adminPanelBtn) {
        adminPanelBtn.style.display = isCurrentUserAdmin() ? 'inline-flex' : 'none';
    }
}

function logout() {
    clearUserSession();

    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('userDashboard').style.display = 'none';

    const accountLabel = document.querySelector('.btn-account-label');
    if (accountLabel) {
        accountLabel.textContent = 'Mi Cuenta';
    }

    closeModal('loginModal');
}

function isCurrentUserAdmin() {
    const currentUser = getUserSession();
    if (!currentUser) return false;
    if (!currentUser.uid) return false;
    return currentUser.uid === ADMIN_UID;
}

let adminAppointments = [];
let adminUsers = [];

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
        if (typeof renderBlockedDaysList === 'function') {
            renderBlockedDaysList();
        }
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

async function openAdminPanel() {
    if (!isCurrentUserAdmin()) {
        const currentUser = getUserSession();
        if (!currentUser) {
            showToast('Debes iniciar sesión como administradora para acceder al panel.', 'error');
            openModal('loginModal');
            return;
        }
        showToast('Acceso restringido solo para la dueña.', 'error');
        return;
    }
    window.location.href = 'admin.html';
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




// Make functions available globally so HTML onclick handlers work
window.openBookingModal = openBookingModal;
window.resetModal = resetModal;
window.selectModalService = selectModalService;
window.nextModalStep = nextModalStep;
window.previousModalStep = previousModalStep;
window.confirmModalAppointment = confirmModalAppointment;
window.openModal = openModal;
window.closeModal = closeModal;
window.closeEditProfile = closeEditProfile;
window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;
window.togglePassword = togglePassword;
window.editProfile = editProfile;
window.showSection = showSection;
window.hideSubSection = hideSubSection;
window.openServiceGallery = openServiceGallery;
window.previousImage = previousImage;
window.nextImage = nextImage;
window.bookServiceFromGallery = bookServiceFromGallery;
window.logout = logout;
window.openAdminPanel = openAdminPanel;
window.initializeCalendar = initializeCalendar;
