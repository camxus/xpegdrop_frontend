import { Star } from "lucide-react";
import * as React from "react";

import { Rating } from "@/lib/api/ratingsApi";
import { MultiSelect } from "./ui/multi-select";
import { useEffect } from "react";
import { useUsers } from "@/hooks/api/useUser";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/hooks/api/useAuth";

interface ImagesFilterProps {
  ratings: Rating[];
  onFilterChange: (filters: {
    userIds: string[];
    ratingValues: number[];
  }) => void;
}

export function ImagesFilter({ ratings, onFilterChange }: ImagesFilterProps) {
  const { user } = useAuth();
  const usersQueries = useUsers(ratings.map((rating) => rating.user_id));

  const uniqueUsers = Array.from(
    new Map(usersQueries.map((user) => [user.data?.user_id, user.data])).values()
  );

  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [selectedRatingValues, setSelectedRatingValues] = React.useState<
    number[]
  >([]);

  useEffect(() => {
    onFilterChange({
      userIds: selectedUserIds,
      ratingValues: selectedRatingValues,
    });
  }, [selectedUserIds, selectedRatingValues]);

  return (
    <div className="mb-4 block md:flex md:flex-wrap md:gap-4 space-y-4 md:space-y-0">
      {/* Rated by */}
      <div className="flex-1 min-w-[100px]">
        <MultiSelect
          className="opacity-[0.5]"
          disabled={!uniqueUsers.length}
          options={uniqueUsers.map((user) => ({
            label: (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user?.avatar as string} />
                  <AvatarFallback className="text-lg">
                    {getInitials(user?.first_name || "", "")}
                  </AvatarFallback>
                </Avatar>
                {user?.username}
              </div>
            ),
            value: user?.user_id || "",
          }))}
          value={selectedUserIds}
          onChange={setSelectedUserIds}
          placeholder="Rated by All"
        />
      </div>

      {/* Rating */}
      <div className="flex-1 min-w-[200px]">
        <MultiSelect
          className="opacity-[0.5]"
          options={[5, 4, 3, 2, 1].map((n) => ({
            label: (
              <div className="flex items-center gap-2">
                {Array.from({ length: n }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3 h-3 transition-colors duration-150",
                      "fill-white text-white"
                    )}
                  />
                ))}
              </div>
            ),
            value: n.toString(),
          }))}
          value={selectedRatingValues.map(String)}
          onChange={(vals) => setSelectedRatingValues(vals.map(Number))}
          placeholder="All Ratings"
        />
      </div>
    </div>
  );
}
