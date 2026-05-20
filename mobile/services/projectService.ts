import api from "./api";

 
export const getCurrentProject = async (clientId: number) => {
  const response = await api.get(`/projets/current/${clientId}`);
  return response.data;
};

// 👇 New function for all projects
export const getClientProjects = async (clientId: number) => {
  const response = await api.get(`/projets/client/${clientId}`);
  return response.data;
};