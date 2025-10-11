import AdminNav from '@/components/admin-nav';
import ChannelContentEditor from '@/components/channel-content-editor';

export default function ChannelWordsSettingsPage() {
  return (
    <div className="admin-shell">
      <AdminNav />
      <ChannelContentEditor sections={['words']} />
    </div>
  );
}
