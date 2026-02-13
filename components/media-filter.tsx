import { Star } from "lucide-react";
import * as React from "react";

import { Rating } from "@/lib/api/ratingsApi";
import { MultiSelect } from "./ui/multi-select";
import { useEffect } from "react";
import { useUsers } from "@/hooks/api/useUser";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Metadata } from "@/types/metadata";

interface MediaFilterProps {
  metadata: Metadata[];
  ratings: Rating[];
  onFilterChange: (filters: {
    uploadedByUserIds: string[];
    ratedByUserIds: string[];
    ratingValues: number[];
  }) => void;
}

export function MediaFilter({ metadata, ratings, onFilterChange }: MediaFilterProps) {
  const userQueries = useUsers(Array.from(new Set([...ratings.map((rating) => rating.user_id), ...metadata.map((m) => m.user_id)])));

  const uniqueUsers = new Map(userQueries.map((user) => [user.data?.user_id, user.data]))

  const uploadUsers = Array.from(
    new Map(
      metadata
        .map((m) => uniqueUsers.get(m.user_id))
        .filter(Boolean)
        .map((user) => [user!.user_id, user!]) 
    ).values()
  );

  const ratingUsers = Array.from(
    new Map(
      ratings
        .map((r) => uniqueUsers.get(r.user_id))
        .filter(Boolean)
        .map((user) => [user!.user_id, user!])
    ).values()
  );

  const [selectedUploadedByUserIds, setSelectedUploadedByUserIds] = React.useState<string[]>([]);
  const [selectedRatedByUserIds, setSelectedRatedByUserIds] = React.useState<string[]>([]);
  const [selectedRatingValues, setSelectedRatingValues] = React.useState<
    number[]
  >([]);

  useEffect(() => {
    onFilterChange({
      uploadedByUserIds: selectedUploadedByUserIds,
      ratedByUserIds: selectedRatedByUserIds,
      ratingValues: selectedRatingValues,
    });
  }, [selectedRatedByUserIds, selectedRatingValues]);

  return (
    <div className="mb-4 block md:flex md:flex-wrap md:gap-4 space-y-4 md:space-y-0">
      <div className="flex-1 min-w-[100px]">
        {/* Uploaded by */}
        <MultiSelect
          className="opacity-[0.5]"
          disabled={!uploadUsers.length}
          options={uploadUsers.map((user) => ({
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
          value={selectedUploadedByUserIds}
          onChange={setSelectedUploadedByUserIds}
          placeholder="Uploaded by All"
        />
      </div>
      {/* Rated by */}
      <div className="flex-1 min-w-[200px]">
        <MultiSelect
          className="opacity-[0.5]"
          disabled={!ratingUsers.length}
          options={ratingUsers.map((user) => ({
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
          value={selectedRatedByUserIds}
          onChange={setSelectedRatedByUserIds}
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
                      "fill-foreground text-foreground"
                    )}
                    style={{ fill: "var(--foreground)" }}
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
