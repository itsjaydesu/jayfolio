import ChannelContentEditor from '@/components/channel-content-editor';

export default function ChannelWordsSettingsPage() {
  return (
    <div className="admin-shell">
      <ChannelContentEditor sections={['words']} />
    </div>
  );
}
