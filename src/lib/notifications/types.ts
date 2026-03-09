export type NotificationType = 'reply' | 'repost' | 'mention' | 'like' | (string & {});

export interface NotificationItem {
    id: number;
    user_id: number;
    actor_id?: number;
    actor_name?: string;
    actor_avatar?: string;
    type: NotificationType;
    post_id?: number;
    is_read: boolean;
    created_at: string;
}

export interface NotificationListParams {
    limit?: number;
    offset?: number;
}
