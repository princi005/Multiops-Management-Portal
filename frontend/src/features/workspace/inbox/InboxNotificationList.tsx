import type { NotificationItem } from "../../../types/notification";
import InboxNotificationRow from "./InboxNotificationRow";

export default function InboxNotificationList({
  items,
  selectedId,
  onSelect,
  onMarkRead,
}: {
  items: NotificationItem[];
  selectedId: string | null;
  onSelect: (item: NotificationItem) => void;
  onMarkRead: (item: NotificationItem) => void;
}) {
  return (
    <div className="max-h-[68vh] overflow-y-auto">
      {items.map((item) => (
        <InboxNotificationRow
          key={item.id}
          item={item}
          selected={item.id === selectedId}
          onSelect={() => onSelect(item)}
          onMarkRead={() => onMarkRead(item)}
        />
      ))}
    </div>
  );
}
