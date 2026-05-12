import { Project } from "./project";
import { Service } from "./service";

export interface HomeStats {
    demandes: number;
    services: number;
    projets: number;
    notifications: number;
}

export interface HomeData {
    stats: HomeStats;
    currentProject: Project | null;
    services: Service[];
}