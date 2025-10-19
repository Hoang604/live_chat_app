import { Conversation } from "./conversation.entity";
import { PaginationDto } from "./pagination.dto";

/**
 * DTO for listing conversations with visitor information included.
 * This ensures type safety between backend and frontend.
 */
export interface ConversationListItemDto {
  id: number;
  status: "open" | "closed" | "pending";
  lastMessageSnippet: string | null;
  lastMessageTimestamp: Date | null;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  visitor: {
    id: number;
    displayName: string;
    currentUrl: string | null;
  };
}

/**
 * Response type for GET /inbox/conversations
 */
export type ConversationListResponseDto = PaginationDto<Conversation>;
