import { Project } from "@/types/project";
import { DeleteIcon } from "lucide-react";

const DeleteProjectDialogView = ({ project }: { project: Project }) => {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <DeleteIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Delete {project.name}</h3>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete{" "}
        <span className="font-semibold">{project.name}</span>?
      </p>
    </div>
  );
};

export default DeleteProjectDialogView;
