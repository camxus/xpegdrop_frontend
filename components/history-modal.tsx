import React from "react";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { Check, FilePlus, MessageSquare, Star } from "lucide-react";
import { HistoryType } from "@/lib/api/historyApi";
import { useHistory } from "@/hooks/api/useHistory";


interface HistoryModalProps {
  projectId: string;
}

const getHistoryIcon = (type: HistoryType) => {
  switch (type) {
    case HistoryType.PROJECT_CREATED:
      return <Check className="h-4 w-4" />;
    case HistoryType.FILE_ADDED:
      return <FilePlus className="h-4 w-4" />;
    case HistoryType.NOTE:
      return <MessageSquare className="h-4 w-4" />;
    case HistoryType.RATING:
      return <Star className="h-4 w-4" />;
    default:
      return null;
  }
};

export const HistoryModal = ({ projectId }: HistoryModalProps) => {
  const { getProjectHistory } = useHistory();
  const { data, isLoading } = getProjectHistory(projectId);

  if (isLoading) {
    <div className="w-full h-full">
      <div className="flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    </div>
  }

  if (!data?.length) {
    return (
      <div className="w-full h-full">
        <div className="flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        </div>
      </div>
    )
  }

  return (
    <Timeline>
      {data.map((item, index) => (
        <TimelineItem
          key={item.project_history_id ?? index}
          date={new Date(item.created_at!)}
          title={item.title}
          description={item.description}
          icon={getHistoryIcon(item.type)}
        />
      ))}
    </Timeline>
  );
};

export default HistoryModal;