import AdminNav from '@/components/admin-nav';
import ChannelContentEditor from '@/components/channel-content-editor';

export default function ChannelSoundsSettingsPage() {
  return (
    <div className="admin-shell">
      <AdminNav />
      <ChannelContentEditor sections={['sounds']} />
    </div>
  );
}
