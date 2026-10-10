// Firebase Cloud Messaging Service Worker
// This file must be served at /firebase-messaging-sw.js
// Config values are hardcoded because service workers cannot access import.meta.env

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD2wBtozKXsTu7UakF9_VxU6Vb2QDd_zfo",
  authDomain: "alvey-website.firebaseapp.com",
  projectId: "alvey-website",
  storageBucket: "alvey-website.firebasestorage.app",
  messagingSenderId: "1020096383368",
  appId: "1:1020096383368:web:5aacf2315e30648042923d",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const title = (payload.notification && payload.notification.title) || 'Alvey';
  const body = (payload.notification && payload.notification.body) || '';
  const icon = (payload.notification && payload.notification.icon) || '/favicon.ico';

  self.registration.showNotification(title, {
    body: body,
    icon: icon,
    badge: '/favicon.ico',
  });
});
