self.addEventListener('push', function(event) {
    if (!event.data) return;

    let data = {};

    try {
        data = event.data.json();
    } catch (e) {
        data = { title: "DEADPOINT", body: event.data.text() };
    }

    const options = {
        body: data.body || 'Há uma nova atualização no site!',
        icon: data.icon || '/icon.png',
        badge: '/badge.png',
        vibrate: [200, 100, 200],
        tag: 'deadpoint-notification',
        renotify: true,
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(
            data.title || 'Atualização!',
            options
        )
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true })
            .then(clientList => {
                for (const client of clientList) {
                    if (client.url === event.notification.data.url && 'focus' in client) {
                        return client.focus();
                    }
                }
                return clients.openWindow(event.notification.data.url);
            })
    );
});