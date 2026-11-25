import React, { useCallback, useEffect, useState } from "react";
import { ProjectsContext } from "./ProjectsContext";
import { API_URL } from "../api";

const ProjectsProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const refreshProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const res = await fetch(`${API_URL}/projects`);
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const projectsInfo = {
    projects,
    setProjects,
    projectsLoading,
    refreshProjects,
  };

  return (
    <ProjectsContext.Provider value={projectsInfo}>
      {children}
    </ProjectsContext.Provider>
  );
};

export default ProjectsProvider;
