import ChannelContentEditor from '@/components/channel-content-editor';

export default function ChannelArtSettingsPage() {
  return (
    <div className="admin-shell">
      <ChannelContentEditor sections={['art']} />
    </div>
  );
}
