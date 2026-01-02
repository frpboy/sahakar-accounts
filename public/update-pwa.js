// PWA Update Script
// Run this in the browser console to force update the PWA icons

// 1. Unregister all service workers
navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
        registration.unregister();
        console.log('✅ Unregistered service worker');
    }
});

// 2. Clear all caches
caches.keys().then(function (names) {
    for (let name of names) {
        caches.delete(name);
        console.log('✅ Cleared cache:', name);
    }
});

// 3. Clear localStorage
localStorage.clear();
console.log('✅ Cleared localStorage');

// 4. Reload the page
setTimeout(() => {
    console.log('🔄 Reloading page to get fresh manifest...');
    window.location.reload(true);
}, 1000);

console.log('⏳ PWA update in progress... Page will reload in 1 second');
