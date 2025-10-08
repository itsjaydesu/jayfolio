import AdminNav from '../../../../../../components/admin-nav';
import ChannelContentEditor from '../../../../../../components/channel-content-editor';

export default function ChannelProjectsSettingsPage() {
  return (
    <div className="admin-shell">
      <AdminNav />
      <ChannelContentEditor sections={['projects']} />
    </div>
  );
}
