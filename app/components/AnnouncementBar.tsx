import type { ReactElement } from "react";
import { Link } from "react-router";

interface Announcement {
  content: ReactElement;
}

const ANNOUNCEMENTS: Announcement[] = [
  {
    content: (
      <p>
        Thoughtful footwear, made for every day.{" "}
        <Link to="/collections" className="announcement-link">
          Discover the collection <span aria-hidden="true">↗</span>
        </Link>
      </p>
    ),
  },
];

export function AnnouncementBar() {
  if (ANNOUNCEMENTS.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Announcement"
      className="announcement-bar bg-on-surface px-margin py-2 text-center"
    >
      <ul role="list">
        {ANNOUNCEMENTS.map((announcement, index) => (
          <AnnouncementBarItem key={index} {...announcement} />
        ))}
      </ul>
    </div>
  );
}

function AnnouncementBarItem({ content }: Announcement) {
  return <li className="type-body-sm text-surface wrap-anywhere">{content}</li>;
}
