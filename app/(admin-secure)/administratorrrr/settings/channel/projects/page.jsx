import ChannelContentEditor from '@/components/channel-content-editor';

export default function ChannelProjectsSettingsPage() {
  return (
    <div className="admin-shell">
      <ChannelContentEditor sections={['projects']} />
    </div>
  );
}
