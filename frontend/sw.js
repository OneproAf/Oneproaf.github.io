// This code goes into frontend/sw.js

console.log('Service Worker: File loaded.');

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push message received.');
  
  // Default data in case the push message is empty
  let notificationData = {
    title: 'MoodScan AI',
    body: 'Time for your daily mood check-in!',
    icon: 'icon-192x192.png' // You will need to create an icon file
  };

  // If the push message has data, parse it
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      console.error('Push event data was not valid JSON.', e);
    }
  }

  const title = notificationData.title;
  const options = {
    body: notificationData.body,
    icon: notificationData.icon
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked.');
  event.notification.close();
  // This part is optional: it focuses the browser tab if the site is already open
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
}); 