import { RoomShell } from '@sqlrooms/room-shell';
import { roomStore } from './store';

export default function App() {
  return (
    <RoomShell className="h-screen w-screen" roomStore={roomStore}>
      <RoomShell.LayoutComposer />
    </RoomShell>
  );
}