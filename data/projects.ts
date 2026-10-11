// 项目数据（建议在后台控制台“项目”页面维护）
export type Project = {
  id: string;
  name: string;
  description: string;
  icon: string;
  githubUrl: string;
  tags: string[];
};

export const projectsData: Project[] = [];
