import ChannelContentEditor from '@/components/channel-content-editor';

export default function ChannelContentSettingsPage() {
  return (
    <div className="admin-shell">
      <ChannelContentEditor sections={['content']} />
    </div>
  );
}
