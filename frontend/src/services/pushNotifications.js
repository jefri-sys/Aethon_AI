import api from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeToPush = async () => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push messaging is not supported');
    }

    const { data: { publicKey } } = await api.get('/push/vapid-public-key');
    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const registration = await navigator.serviceWorker.ready;
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    };

    const subscription = await registration.pushManager.subscribe(subscribeOptions);
    
    await api.post('/push/subscribe', subscription.toJSON());
    return { success: true };
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return { success: false, error: error.message };
  }
};

export const unsubscribeFromPush = async () => {
  try {
    if (!('serviceWorker' in navigator)) return { success: true };
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      // Browser-side unsubscribe is enough; backend will delete it when the next push fails
    }
    return { success: true };
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return { success: false, error: error.message };
  }
};

export const getRegisteredDevices = async () => {
  try {
    const { data } = await api.get('/push/subscriptions');
    return { success: true, data };
  } catch (error) {
    console.error('Error getting registered devices:', error);
    return { success: false, error: error.message };
  }
};

export const revokeDevice = async (subscriptionId) => {
  try {
    await api.delete(`/push/subscriptions/${subscriptionId}`);
    return { success: true };
  } catch (error) {
    console.error('Error revoking device:', error);
    return { success: false, error: error.message };
  }
};
