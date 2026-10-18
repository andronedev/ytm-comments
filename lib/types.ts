export type SortKey = 'top' | 'newest';

/** A slice of comment text: plain, or something clickable. */
export type TextRun =
  | { kind: 'text'; text: string }
  | { kind: 'timestamp'; text: string; seconds: number; videoId: string | null }
  | { kind: 'link'; text: string; url: string };

export interface Author {
  name: string;
  avatar: string | null;
  channelUrl: string | null;
  isCreator: boolean;
  isVerified: boolean;
  isArtist: boolean;
}

export interface Reply {
  id: string;
  author: Author;
  runs: TextRun[];
  publishedTime: string;
  likeCount: string;
  isHearted: boolean;
}

export interface Comment extends Reply {
  isPinned: boolean;
  pinnedText: string | null;
  replyCount: number;
  /** As YouTube formats it ("682", "1.2K"). */
  replyCountText: string;
  replyContinuation: string | null;
}

export interface CommentsPage {
  items: Comment[];
  nextPageToken: string | null;
  sortTokens: { top: string | null; newest: string | null };
  totalCount: string | null;
}

export interface RepliesPage {
  items: Reply[];
  nextPageToken: string | null;
}
