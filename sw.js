// sw.js

self.addEventListener('push', function (event) {
    const options = {
        body: event.data.text(),
        icon: 'icon.png',
    };

    event.waitUntil(
        self.registration.showNotification('通知タイトル', options)
    );
});
