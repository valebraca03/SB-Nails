let currentStep = 1;
let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
const ADMIN_UID = "ZVUzzwV2HGYF84PiOOuTMoZD79f1";

const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
];

const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];


const services = {
    'semipermanente': { name: 'Semipermanente', price: 13000, duration: 40 },
    'capping-gel': { name: 'Capping Gel', price: 15000, duration: 90 },
    'soft-gel': { name: 'Soft Gel', price: 17000, duration: 90 },
    'capping-polygel': { name: 'Capping Polygel', price: 17000, duration: 120 },
    'retiro': { name: 'Retiro', price: 6000, duration: 20 },
    'belleza-pies': { name: 'Belleza de Pies', price: 14000, duration: 40 }
};
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
    initializeCalendar();
}

// closeModal inicial duplicado eliminado; se conserva una sola implementación más abajo

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
        alert('Por favor selecciona un servicio');
        return;
    }
    
    if (currentStep === 2 && !selectedDate) {
        alert('Por favor selecciona una fecha');
        return;
    }
    
    if (currentStep === 3 && !selectedTime) {
        alert('Por favor selecciona una hora');
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
    document.getElementById('modalPrevMonth').onclick = () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendarHeader();
        generateCalendarDays();
    };
    
    document.getElementById('modalNextMonth').onclick = () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCalendarHeader();
        generateCalendarDays();
    };
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



function generateTimeSlots() {
    const timeSlotsContainer = document.getElementById('modalTimeSlots');
    timeSlotsContainer.innerHTML = '';
    
    timeSlots.forEach(time => {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        timeSlot.textContent = time;
        timeSlot.addEventListener('click', () => selectTime(time, timeSlot));
        

        
        timeSlotsContainer.appendChild(timeSlot);
    });
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
        alert('Por favor completa todos los campos obligatorios');
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

    alert(`¡Cita confirmada!\n\nServicio: ${selectedService.name}\nFecha: ${selectedDate.toLocaleDateString('es-ES')}\nHora: ${selectedTime}\nCliente: ${name}\n\nTe contactaremos por WhatsApp para confirmar los detalles.`);

    closeModal('bookingModal');
}

document.addEventListener('DOMContentLoaded', function() {

    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    
    document.getElementById('bookingModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal('bookingModal');
        }
    });
    
    document.querySelector('.modal-content').addEventListener('click', function(e) {
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

document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('modalClientPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
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
document.addEventListener('DOMContentLoaded', function() {
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
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const isRegister = document.getElementById('registerToggle').classList.contains('active');
            const isEditMode = loginForm.classList.contains('edit-mode');
            const email = document.getElementById('loginEmail').value.trim();
            const phone = document.getElementById('loginPhone').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            submitBtn.disabled = true;
            
            try {
                if (isRegister && !isEditMode) {
                    const name = document.getElementById('loginName').value.trim();
                    const confirmPassword = document.getElementById('confirmPassword').value;
                    const acceptTerms = document.getElementById('acceptTerms').checked;
                    const birthday = document.getElementById('loginBirthday').value;
                    
                    if (!email) {
                        alert('El correo es obligatorio');
                        return;
                    }
                    
                    if (password !== confirmPassword) {
                        alert('Las contraseñas no coinciden');
                        return;
                    }
                    
                    if (!acceptTerms) {
                        alert('Debes aceptar los términos y condiciones');
                        return;
                    }
                    
                    if (password.length < 5) {
                        alert('La contraseña debe tener al menos 5 caracteres');
                        return;
                    }
                    
                    if (!name) {
                        alert('El nombre es obligatorio');
                        return;
                    }
                    
                    const userExists = await checkUserExists(email);
                    if (userExists) {
                        alert('Ya existe una cuenta con este correo electrónico');
                        return;
                    }
                    
                    const registerResult = await registerUser({
                        name: name,
                        email: email,
                        phone: phone,
                        password: password,
                        birthday: birthday
                    });
                    
                    if (registerResult.success) {
                        alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
                        showLoginForm();
                        loginForm.reset();
                    } else {
                        alert(`Error al registrar: ${registerResult.error}`);
                    }
                    
                } else if (isEditMode) {
                    alert('Función de editar perfil - próximamente disponible');
                    
                } else {
                    if (!email) {
                        alert('El correo es obligatorio');
                        return;
                    }
                    const loginResult = await loginUser(email, password);
                    
                    if (loginResult.success) {
                        saveUserSession(loginResult.user);
                        showUserDashboard(loginResult.user);
                        alert(`¡Bienvenida de vuelta, ${loginResult.user["Nombre Completo"]}!`);
                    } else {
                        alert(`Error al iniciar sesión: ${loginResult.error}`);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión. Por favor, intenta nuevamente.');
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
        alert('Debes iniciar sesión para editar tu perfil');
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
    alert(`Función de ${section} - próximamente`);
}

window.addEventListener('click', function(event) {
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
        alert(`¡Bienvenida de vuelta, ${sessionUser["Nombre Completo"]}!`);

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
        alert('Error al iniciar sesión con Google.');
    }
}


// Datos de servicios con imágenes de ejemplo
const servicesData = {
    'semipermanente': { 
        name: 'Semipermanente', 
        price: 13000, 
        duration: 40, 
        images: [
            'Fotos/semipermanente1.jpg',
            'Fotos/semipermanente2.jpg',
            'Fotos/semipermanente3.jpg',
            'Fotos/semipermanente4.jpg',
            'Fotos/semipermanente5.jpg'
        ]
    },
    'capping-gel': { 
        name: 'Capping Gel', 
        price: 15000, 
        duration: 90, 
        images: [
            'Fotos/capping-gel1.jpg',
            'Fotos/capping-gel2.jpg',
            'Fotos/capping-gel3.jpg',
            'Fotos/capping-gel4.jpg',
            'Fotos/capping-gel5.jpg'
        ]
    },
    'soft-gel': { 
        name: 'Soft Gel', 
        price: 17000, 
        duration: 90, 
        images: [
            'Fotos/soft-gel1.jpg',
            'Fotos/soft-gel2.jpg',
            'Fotos/soft-gel3.jpg',
            'Fotos/soft-gel4.jpg',
            'Fotos/soft-gel5.jpg'
        ]
    },
    'capping-polygel': { 
        name: 'Capping Polygel', 
        price: 17000, 
        duration: 120, 
        images: [
            'Fotos/capping-polygel1.jpg',
            'Fotos/capping-polygel2.jpg',
            'Fotos/capping-polygel3.jpg',
            'Fotos/capping-polygel4.jpg',
            'Fotos/capping-polygel5.jpg'
        ]
    },
    'retiro': { 
        name: 'Retiro', 
        price: 6000, 
        duration: 20, 
        images: [
            'Fotos/retiro1.jpg',
            'Fotos/retiro2.jpg',
            'Fotos/retiro3.jpg'
        ]
    },
    'belleza-pies': { 
        name: 'Belleza de Pies', 
        price: 14000, 
        duration: 40, 
        images: [
            'Fotos/belleza-pies1.jpg',
            'Fotos/belleza-pies2.jpg',
            'Fotos/belleza-pies3.jpg',
            'Fotos/belleza-pies4.jpg'
        ]
    }
};

let currentGalleryServiceKey = null;
let currentImageIndex = 0;
let galleryImages = [];

// Abre la galería con efecto carrusel 3D
function openServiceGallery(serviceKey, serviceName) {
    currentGalleryServiceKey = serviceKey;
    currentImageIndex = 0;
    
    const service = servicesData[serviceKey];
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
            img.alt = `${servicesData[currentGalleryServiceKey].name} ${index + 1}`;
            
            img.onerror = function() {
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
        
        // No modificar galleryImages ni iniciar efectos automáticos
        return;
    } else {
        // Crear imágenes reales
        galleryImages.forEach((imageSrc, index) => {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'carousel-image';
            if (index === 0) imageContainer.classList.add('active');
            
            const img = document.createElement('img');
            img.src = imageSrc;
            img.alt = `${servicesData[currentGalleryServiceKey].name} ${index + 1}`;
            
            img.onerror = function() {
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

// Función para navegar en placeholder (circular)
function goToPlaceholderImage(index) {
    goToImage(index);
}

// Abre la galería con carrusel mejorado
function openServiceGallery(serviceKey, serviceName) {
    currentGalleryServiceKey = serviceKey;
    currentImageIndex = 0;
    
    const service = servicesData[serviceKey];
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

// Limpieza de carrusel integrada en closeModal; override eliminado

// Reservar servicio desde la galería
function bookServiceFromGallery() {
    if (!currentGalleryServiceKey) return;
    
    const service = servicesData[currentGalleryServiceKey];
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
            }
        } catch (firestoreError) {
            console.error('Error al leer Firestore en loginUser (se continúa con datos básicos):', firestoreError);
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
                "Visitas": userData.Visitas
            }
        };
    } catch (error) {
        console.error('Error en loginUser:', error);
        let message = 'Error al iniciar sesión.';
        if (error && error.code === 'auth/invalid-credential') {
            message = 'Correo o contraseña incorrectos.';
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

// Funciones para manejar el estado de sesión
function saveUserSession(user) {
    localStorage.setItem('sbsofinails_user', JSON.stringify(user));
}

function getUserSession() {
    const userStr = localStorage.getItem('sbsofinails_user');
    return userStr ? JSON.parse(userStr) : null;
}

function clearUserSession() {
    localStorage.removeItem('sbsofinails_user');
}

function showUserDashboard(user) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('userDashboard').style.display = 'block';
    
    document.getElementById('dashboardUserName').textContent = `¡Hola, ${user["Nombre Completo"]}!`;
    
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
    alert('Sesión cerrada exitosamente');
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
            alert('Debes iniciar sesión como administradora para acceder al panel.');
            openModal('loginModal');
            return;
        }
        alert('Acceso restringido solo para la dueña.');
        return;
    }
    openModal('adminModal');
    await Promise.all([
        loadAdminAppointments(),
        loadAdminUsers(),
        refreshBlockedDatesFromFirestore()
    ]);
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
