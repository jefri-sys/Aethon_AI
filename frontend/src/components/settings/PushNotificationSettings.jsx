import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Trash2, Bell } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { subscribeToPush, unsubscribeFromPush, getRegisteredDevices, revokeDevice } from '../../services/pushNotifications';

const parseUserAgent = (ua) => {
  if (!ua) return 'Unknown Device';
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edge')) browser = 'Edge';

  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'Mac';
  else if (ua.includes('iPhone')) os = 'iPhone';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} on ${os}`;
};

const PushNotificationSettings = () => {
  const [enabled, setEnabled] = useState(false);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDevices = async () => {
    const { success, data } = await getRegisteredDevices();
    if (success) {
      setDevices(data);
      if (data.length > 0) {
        setEnabled(true);
      } else {
        setEnabled(false);
      }
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleToggle = async (val) => {
    setLoading(true);
    if (val) {
      const res = await subscribeToPush();
      if (res.success) {
        setEnabled(true);
        await fetchDevices();
      } else {
        alert(res.error || 'Failed to enable push notifications');
        setEnabled(false);
      }
    } else {
      const res = await unsubscribeFromPush();
      if (res.success) {
        setEnabled(false);
        await fetchDevices();
      } else {
        alert(res.error || 'Failed to disable push notifications');
      }
    }
    setLoading(false);
  };

  const handleRemoveDevice = async (id) => {
    const res = await revokeDevice(id);
    if (res.success) {
      fetchDevices();
    }
  };

  return (
    <div className="mt-8 border-t border-surface-border pt-8">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="text-brand-primary" size={24} />
        <h3 className="text-lg font-semibold text-text-primary">Push Notifications</h3>
      </div>
      
      <div className="flex justify-between items-center p-4 border border-surface-border bg-surface-raised rounded-lg mb-6">
        <div>
          <p className="font-medium text-text-primary">Enable Push Notifications</p>
          <p className="text-sm text-text-secondary">Receive alerts even when the app is closed</p>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} disabled={loading} />
      </div>

      {devices.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-secondary uppercase mb-3 tracking-wider">Registered Devices</h4>
          <div className="space-y-3">
            {devices.map(device => (
              <div key={device._id} className="flex justify-between items-center p-3 border border-surface-border rounded-lg bg-surface-base">
                <div className="flex items-center gap-3">
                  {device.userAgent.includes('Mobile') || device.userAgent.includes('iPhone') || device.userAgent.includes('Android') ? (
                    <Smartphone size={18} className="text-text-tertiary" />
                  ) : (
                    <Monitor size={18} className="text-text-tertiary" />
                  )}
                  <div>
                    <p className="font-medium text-text-primary text-sm">{parseUserAgent(device.userAgent)}</p>
                    <p className="text-xs text-text-tertiary">Added: {new Date(device.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <Button variant="ghost" tone="danger" size="sm" onClick={() => handleRemoveDevice(device._id)} className="h-8 px-2 text-xs">
                  <Trash2 size={14} className="mr-1" /> Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PushNotificationSettings;
