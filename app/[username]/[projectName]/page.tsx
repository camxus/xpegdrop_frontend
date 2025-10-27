import { Metadata } from "next";
import ProjectPage from "./client";
import { projectsApi } from "@/lib/api/projectsApi";
import { ApiError } from "@/lib/api/client";
import { userApi } from "@/lib/api/usersApi";

type PageParams = Promise<{ username: string; projectName: string }>;

// generateMetadata expects a destructured object with `params: PageParams`
export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { username, projectName } = await params;

  let metadata = {} as Metadata;
  const userData = await userApi.getUserByUsername(username);

  try {
    const projectData = await projectsApi.getProjectByShareUrl(
      username,
      projectName
    );

    const project = projectData.project;

    const images =
      projectData.images?.map((image: any) => image.thumbnail_url) ?? [];

    const imagesSlice = images.slice(0, 3);

    metadata = {
      title: `${project.name} by ${userData.first_name} | fframess`,
      description:
        "Your art is yours. Your data is yours. A platform built by artists, for artists.",
      openGraph: {
        title: `${project.name} by ${userData.first_name} | fframess`,
        description:
          "Your art is yours. Your data is yours. A platform built by artists, for artists.",
        images: imagesSlice,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${project.name} by ${userData.first_name} | fframess`,
        description:
          "Your art is yours. Your data is yours. A platform built by artists, for artists.",
        images: imagesSlice,
      },
    };
  } catch (error) {
    const status = (error as ApiError)?.status;
    const message = (error as ApiError)?.message;

    if (status === 404) {
      return {
        title: "Project not found | fframess",
        description: "",
      };
    }

    if (status === 400 && message === "EMAIL_REQUIRED") {
      return {
        title: `Private project by ${userData.first_name} | fframess`,
        description:
          "Your art is yours. Your data is yours. A platform built by artists, for artists.",
        openGraph: {
          title: `Private project by ${userData.first_name} | fframess`,
          description:
            "Your art is yours. Your data is yours. A platform built by artists, for artists.",
          type: "website",
        },
        twitter: {
          card: "summary_large_image",
          description:
            "Your art is yours. Your data is yours. A platform built by artists, for artists.",
          title: `Private project by ${userData.first_name} | fframess`,
        },
      };
    }
  }

  return metadata;
}

// Page component
export default function Page() {
  return <ProjectPage />;
}
