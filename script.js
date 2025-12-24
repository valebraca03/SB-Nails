let currentStep = 1;
let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

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
    
    const occupiedDates = [
        '2025-01-28', 
        '2025-02-05', 
        '2025-02-12' 
    ];
    
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
        } else if (occupiedDates.includes(dateString)) {

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



function confirmModalAppointment() {
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
        service: selectedService,
        date: selectedDate,
        time: selectedTime,
        client: {
            name: name,
            phone: phone,
            notes: notes
        },
        timestamp: new Date()
    };
    

    console.log('Appointment created:', appointment);
    

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
                    
                    const userExists = await checkUserExists(phone);
                    if (userExists) {
                        alert('Ya existe una cuenta con este número de teléfono');
                        return;
                    }
                    
                    const registerResult = await registerUser({
                        name: name,
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
                    const loginResult = await loginUser(phone, password);
                    
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

        const normalizedPhone = userData.phone.replace(/\s/g, '');
        const baseIdentifier = normalizedPhone || userData.phone;
        const syntheticEmail = `${baseIdentifier}@sbsofinails.local`;

        const credential = await createUserWithEmailAndPassword(
            auth,
            syntheticEmail,
            userData.password
        );

        const uid = credential.user.uid;

        const userDocRef = doc(db, 'users', uid);
        await setDoc(userDocRef, {
            uid: uid,
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
            message = 'Ya existe una cuenta con este teléfono.';
        }
        return {
            success: false,
            error: message
        };
    }
}

async function loginUser(phone, password) {
    try {
        console.log('Login Firebase para teléfono:', phone);
        const {
            auth,
            db,
            signInWithEmailAndPassword,
            doc,
            getDoc
        } = await import('./firebaseConfig.js');

        const normalizedPhone = phone.replace(/\s/g, '');
        const baseIdentifier = normalizedPhone || phone;
        const syntheticEmail = `${baseIdentifier}@sbsofinails.local`;

        const credential = await signInWithEmailAndPassword(
            auth,
            syntheticEmail,
            password
        );

        const uid = credential.user.uid;
        const userDocRef = doc(db, 'users', uid);
        const snapshot = await getDoc(userDocRef);

        let userData;

        if (snapshot.exists()) {
            const data = snapshot.data();
            userData = {
                uid: uid,
                Numero: data.Numero || phone,
                NombreCompleto: data.NombreCompleto || 'Usuario',
                FechaCumpleanos: data.FechaCumpleanos || 'none',
                Puntos: data.Puntos || 0,
                Visitas: data.Visitas || 0
            };
        } else {
            userData = {
                uid: uid,
                Numero: phone,
                NombreCompleto: 'Usuario',
                FechaCumpleanos: 'none',
                Puntos: 0,
                Visitas: 0
            };
        }

        return {
            success: true,
            user: {
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
            message = 'Teléfono o contraseña incorrectos.';
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
