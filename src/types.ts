export interface SampleData {
  codigo: string;
  metodoAnalise: string;
  tipoAmostra: string;
  identificacaoAmostra: string;
  dataDistribuicao: string; // ISO string
  dataOrdemEntrega: string; // ISO string
  dataLimite: string; // ISO string
  amostrasEmAnalise: string; // User input
}

export interface DashboardDay {
  date: Date;
  totalDia: number;
  totalOk: number;
  pendente: number;
}
