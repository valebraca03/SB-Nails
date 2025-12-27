import { services, timeSlots, monthNames, ADMIN_UID } from './data.js';
import { showToast } from './toast.js';

let currentStep = 1;
let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

let blockedDates = [
    '2025-01-28',
    '2025-02-05',
    '2025-02-12'
];


function openBookingModal() {
    const modal = document.getElementById('bookingModal');
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    resetModal();
    resetModal();
    initializeCalendar();
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

function initializeCalendar() {
    updateCalendarHeader();
    generateCalendarDays();
    setupCalendarNavigation();
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
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            updateCalendarHeader();
            generateCalendarDays();
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

    showToast(`¡Cita confirmada! Te contactaremos por WhatsApp para confirmar los detalles.`, 'success', 5000);

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
            accountLabel.textContent = currentUser["Nombre Completo"].split(' ')[0];
        }
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
                        showToast('¡Registro exitoso! Ahora puedes iniciar sesión.', 'success');
                        showLoginForm();
                        loginForm.reset();
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
                        showToast(`¡Bienvenida de vuelta, ${loginResult.user["Nombre Completo"]}!`, 'success');
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

function editProfile() {
    const currentUser = getUserSession();
    if (!currentUser) {
        showToast('Debes iniciar sesión para editar tu perfil', 'warning');
        return;
    }

    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('userDashboard').style.display = 'none';

    document.getElementById('loginName').value = currentUser["Nombre Completo"] || '';
    document.getElementById('loginPhone').value = currentUser["Numero"] || '';
    document.getElementById('loginBirthday').value = currentUser["Fecha de Cumpleaños"] === 'none' ? '' : currentUser["Fecha de Cumpleaños"];

    showRegisterForm();
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
    document.getElementById('loginForm').classList.add('edit-mode');
}

function showSection(section) {
    showToast(`Función de ${section} - próximamente`, 'info');
}

window.addEventListener('click', function (event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        closeModal('loginModal');
    }
});

async function loginWithGoogle() {
    try {
        const {
            auth,
            db,
            GoogleAuthProvider,
            signInWithPopup,
            doc,
            getDoc,
            setDoc
        } = await import('./firebaseConfig.js');

        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const uid = user.uid;

        let userData = {
            uid: uid,
            Email: user.email || '',
            Numero: '',
            NombreCompleto: user.displayName || 'Usuario',
            FechaCumpleanos: 'none',
            Puntos: 0,
            Visitas: 0
        };

        const sessionUser = {
            uid: userData.uid,
            Email: userData.Email,
            "Numero": userData.Numero,
            "Nombre Completo": userData.NombreCompleto,
            "Fecha de Cumpleaños": userData.FechaCumpleanos,
            "Puntos": userData.Puntos,
            "Visitas": userData.Visitas
        };

        saveUserSession(sessionUser);
        showUserDashboard(sessionUser);

        const accountLabel = document.querySelector('.btn-account-label');
        if (accountLabel) {
            accountLabel.textContent = sessionUser["Nombre Completo"].split(' ')[0];
        }

        closeModal('loginModal');
        showToast(`¡Bienvenida de vuelta, ${sessionUser["Nombre Completo"]}!`, 'success');

        (async () => {
            try {
                const userDocRef = doc(db, 'users', uid);
                const snapshot = await getDoc(userDocRef);

                let syncedData = userData;

                if (snapshot.exists()) {
                    const data = snapshot.data();
                    syncedData = {
                        uid: uid,
                        Email: data.Email || syncedData.Email,
                        Numero: data.Numero || '',
                        NombreCompleto: data.NombreCompleto || syncedData.NombreCompleto,
                        FechaCumpleanos: data.FechaCumpleanos || syncedData.FechaCumpleanos,
                        Puntos: data.Puntos || 0,
                        Visitas: data.Visitas || 0
                    };
                } else {
                    const userDocRefNew = doc(db, 'users', uid);
                    await setDoc(userDocRefNew, {
                        uid: uid,
                        Email: syncedData.Email,
                        Numero: syncedData.Numero,
                        NombreCompleto: syncedData.NombreCompleto,
                        FechaCumpleanos: syncedData.FechaCumpleanos,
                        Puntos: syncedData.Puntos,
                        Visitas: syncedData.Visitas,
                        CreadoEn: new Date().toISOString()
                    });
                }

                const updatedSessionUser = {
                    uid: syncedData.uid,
                    Email: syncedData.Email,
                    "Numero": syncedData.Numero,
                    "Nombre Completo": syncedData.NombreCompleto,
                    "Fecha de Cumpleaños": syncedData.FechaCumpleanos,
                    "Puntos": syncedData.Puntos,
                    "Visitas": syncedData.Visitas
                };

                saveUserSession(updatedSessionUser);
                showUserDashboard(updatedSessionUser);

                const updatedAccountLabel = document.querySelector('.btn-account-label');
                if (updatedAccountLabel) {
                    updatedAccountLabel.textContent = updatedSessionUser["Nombre Completo"].split(' ')[0];
                }
            } catch (firestoreError) {
                console.error('Error al sincronizar datos de Google con Firestore:', firestoreError);
            }
        })();
    } catch (error) {
        console.error('Error en loginWithGoogle:', error);
        showToast('Error al iniciar sesión con Google.', 'error');
    }
}


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

        const avatar = getRandomAvatar();

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
            Avatar: avatar,
            CreadoEn: new Date().toISOString()
        });

        return {
            success: true,
            user: {
                uid: uid,
                Email: userData.email,
                Numero: userData.phone,
                NombreCompleto: userData.name,
                FechaCumpleanos: userData.birthday || 'none',
                Puntos: 0,
                Visitas: 0,
                Avatar: avatar
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
        if (!result.user["Nombre Completo"] || result.user["Nombre Completo"] === 'Usuario') {
            result.user["Nombre Completo"] = name;
        }
    }
    return result;
}

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
            Visitas: 0,
            Avatar: 'avatar-rosa'
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
                        Visitas: data.Visitas || 0,
                        Avatar: data.Avatar || userData.Avatar
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
                        Avatar: userData.Avatar,
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
                "Numero": userData.Numero,
                "Nombre Completo": userData.NombreCompleto,
                "Fecha de Cumpleaños": userData.FechaCumpleanos,
                "Puntos": userData.Puntos,
                "Visitas": userData.Visitas,
                "Avatar": userData.Avatar
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

const AVATAR_OPTIONS = [
    'avatar-rosa',
    'avatar-lila',
    'avatar-brillo',
    'avatar-corazon',
    'avatar-estrellas'
];

function getRandomAvatar() {
    const index = Math.floor(Math.random() * AVATAR_OPTIONS.length);
    return AVATAR_OPTIONS[index];
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

    document.getElementById('dashboardUserName').textContent = `¡Hola, ${user["Nombre Completo"]}!`;

    const avatarElement = document.querySelector('.user-avatar');
    if (avatarElement) {
        avatarElement.className = 'user-avatar';
        const avatarKey = user["Avatar"] || 'avatar-rosa';
        avatarElement.classList.add(avatarKey);
    }

    const points = parseInt(user["Puntos"]) || 0;
    let level = 'Miembro Nuevo';
    if (points >= 100) level = 'Miembro Oro';
    else if (points >= 50) level = 'Miembro Plata';
    else if (points >= 20) level = 'Miembro Bronce';

    document.getElementById('dashboardUserLevel').textContent = level;
    document.getElementById('dashboardPoints').textContent = points;
    document.getElementById('totalVisits').textContent = user["Visitas"] || 0;

    let nextLevelPoints = 20;
    if (points >= 50) nextLevelPoints = 100;
    else if (points >= 20) nextLevelPoints = 50;

    const progressPercent = Math.min((points / nextLevelPoints) * 100, 100);
    document.getElementById('loyaltyProgress').style.width = `${progressPercent}%`;

    const pointsNeeded = Math.max(0, nextLevelPoints - points);
    document.getElementById('progressText').textContent =
        pointsNeeded > 0 ? `${pointsNeeded} puntos para el próximo nivel` : '¡Nivel máximo alcanzado!';

    const accountLabel = document.querySelector('.btn-account-label');
    if (accountLabel) {
        accountLabel.textContent = user["Nombre Completo"].split(' ')[0];
    }

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
    showToast('Sesión cerrada exitosamente', 'info');
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
        blockedDates = dates.length > 0 ? dates : blockedDates;
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
window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;
window.togglePassword = togglePassword;
window.editProfile = editProfile;
window.showSection = showSection;
window.loginWithGoogle = loginWithGoogle;
window.openServiceGallery = openServiceGallery;
window.previousImage = previousImage;
window.nextImage = nextImage;
window.bookServiceFromGallery = bookServiceFromGallery;
window.logout = logout;
window.openAdminPanel = openAdminPanel;
window.initializeCalendar = initializeCalendar;
