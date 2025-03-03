export type Task = {
  completed: boolean;
  id: number;
  title: string;
  importance: number;
  deadline: string | null;
  priority?: number;
  completed_at?: string;
}; 