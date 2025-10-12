import ChannelContentEditor from '@/components/channel-content-editor';

export default function ChannelAboutSettingsPage() {
  return (
    <div className="admin-shell">
      <ChannelContentEditor sections={['about']} />
    </div>
  );
}
