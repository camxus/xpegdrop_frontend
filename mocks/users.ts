import { User } from "@/types/user";

export const mockUsers: User[] = [
  {
    user_id: "user_1",
    username: "camillus",
    email: "camillus@northstar.dev",
    first_name: "Camillus",
    last_name: "Konkwo",
    bio: "Artist, software engineer, and founder.",
    avatar: "https://i.pravatar.cc/150?img=12",
    created_at: "2024-12-01T10:00:00.000Z",

    membership: {
      membership_id: "agency",
      status: "active",
    },

    stripe: {
      customer_id: "cus_123456789",
    },

    dropbox: {
      access_token: "dropbox_access_token_mock",
      refresh_token: "dropbox_refresh_token_mock",
    },
  },

  {
    user_id: "user_2",
    username: "sarah",
    email: "sarah.mueller@agency.com",
    first_name: "Sarah",
    last_name: "Müller",
    bio: "Creative director & strategist.",
    avatar: "https://i.pravatar.cc/150?img=32",
    created_at: "2024-12-05T14:30:00.000Z",

    membership: {
      membership_id: "pro",
      status: "trialing",
    },

    stripe: {
      customer_id: "cus_987654321",
    },
  },

  {
    user_id: "user_3",
    username: "julien",
    email: "julien@collective.paris",
    first_name: "Julien",
    last_name: "Moreau",
    bio: "Filmmaker & sound designer.",
    avatar: "https://i.pravatar.cc/150?img=45",
    created_at: "2025-01-10T09:15:00.000Z",

    membership: {
      membership_id: "free",
      status: "active",
    },
  },

  {
    // Edge-case user (no avatar, no membership, no stripe)
    user_id: "user_4",
    username: "guest_user",
    email: "guest@example.com",
    first_name: "Guest",
    last_name: "User",
    created_at: "2025-02-20T08:00:00.000Z",
  },
];
