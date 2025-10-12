import ChannelContentEditor from '@/components/channel-content-editor';

export default function ChannelSoundsSettingsPage() {
  return (
    <div className="admin-shell">
      <ChannelContentEditor sections={['sounds']} />
    </div>
  );
}
