import AdminNav from '@/components/admin-nav';
import ChannelContentEditor from '@/components/channel-content-editor';

export default function ChannelArtSettingsPage() {
  return (
    <div className="admin-shell">
      <AdminNav />
      <ChannelContentEditor sections={['art']} />
    </div>
  );
}
