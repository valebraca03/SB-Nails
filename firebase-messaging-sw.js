importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyBLbb62O-Z0Y5NKVXUxVkmPM6sYJaejrcI",
    authDomain: "sofinail.firebaseapp.com",
    projectId: "sofinail",
    storageBucket: "sofinail.firebasestorage.app",
    messagingSenderId: "520258822742",
    appId: "1:520258822742:web:eeac6aeb11c4c3f4af91f7"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/favicon.ico' // Ajustar si tienes un icono específico
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
