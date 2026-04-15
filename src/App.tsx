import React, { useState, useMemo } from 'react';
import { 
  format, 
  addDays, 
  isSameDay, 
  differenceInDays, 
  parseISO,
  startOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { 
  Beaker, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText,
  Search,
  RefreshCw
} from 'lucide-react';
import { SampleData, DashboardDay } from './types';

// Mock initial data
const INITIAL_DATA: SampleData[] = [
  {
    codigo: 'LAB-001',
    metodoAnalise: 'HPLC',
    tipoAmostra: 'Solo',
    identificacaoAmostra: 'Lote A - Fazenda Sul',
    dataDistribuicao: new Date().toISOString(),
    dataOrdemEntrega: addDays(new Date(), 7).toISOString(),
    dataLimite: addDays(new Date(), 1).toISOString(),
    amostrasEmAnalise: ''
  },
  {
    codigo: 'LAB-002',
    metodoAnalise: 'GC-MS',
    tipoAmostra: 'Água',
    identificacaoAmostra: 'Poço 04',
    dataDistribuicao: addDays(new Date(), -1).toISOString(),
    dataOrdemEntrega: addDays(new Date(), 4).toISOString(),
    dataLimite: addDays(new Date(), 0).toISOString(),
    amostrasEmAnalise: 'LAB-002'
  },
  {
    codigo: 'LAB-003',
    metodoAnalise: 'ICP-OES',
    tipoAmostra: 'Minério',
    identificacaoAmostra: 'Extração Norte',
    dataDistribuicao: addDays(new Date(), -2).toISOString(),
    dataOrdemEntrega: addDays(new Date(), 10).toISOString(),
    dataLimite: addDays(new Date(), 2).toISOString(),
    amostrasEmAnalise: ''
  }
];

export default function App() {
  const [samples, setSamples] = useState<SampleData[]>(INITIAL_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = () => {
    // @ts-ignore - google is defined in GAS environment
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      setIsLoading(true);
      // @ts-ignore
      google.script.run
        .withSuccessHandler((data: SampleData[]) => {
          setSamples(data);
          setIsLoading(false);
          toast.success('Dados sincronizados com Google Sheets');
        })
        .withFailureHandler((err: any) => {
          setIsLoading(false);
          toast.error('Erro ao carregar dados da planilha');
          console.error(err);
        })
        .getSheetData();
    } else {
      toast.info('Modo de demonstração: Google Sheets não detectado');
    }
  };

  // GAS Integration: Fetch data on mount if running in GAS
  React.useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    const newSamples = [...samples];
    const codigo = newSamples[index].codigo;
    newSamples[index].amostrasEmAnalise = value;
    setSamples(newSamples);

    // GAS Integration: Save change to sheet
    // @ts-ignore
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      // @ts-ignore
      google.script.run
        .withSuccessHandler(() => {
          toast.success(`Amostra ${codigo} atualizada`);
        })
        .updateAmostraAnalise(codigo, value);
    }
  };

  const dashboardData = useMemo(() => {
    const today = startOfDay(new Date());
    const days: DashboardDay[] = [];

    for (let i = 0; i < 8; i++) {
      const currentDay = addDays(today, i);
      
      const daySamples = samples.filter(s => 
        isSameDay(parseISO(s.dataLimite), currentDay)
      );

      const totalDia = daySamples.length;
      
      const totalOk = daySamples.filter(s => {
        const diff = differenceInDays(parseISO(s.dataLimite), parseISO(s.dataDistribuicao));
        return diff >= 2;
      }).length;

      days.push({
        date: currentDay,
        totalDia,
        totalOk,
        pendente: totalDia - totalOk
      });
    }

    return days;
  }, [samples]);

  const filteredSamples = samples.filter(s => 
    s.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.identificacaoAmostra.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-bg-main flex flex-col font-sans">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-primary text-white px-6 py-3 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-2">
          <Beaker className="h-5 w-5 text-accent" />
          <h1 className="text-lg font-bold tracking-wider uppercase">
            LABTRACK <span className="font-light text-secondary">| Web App</span>
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs opacity-90">
          <button 
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-white px-3 py-1.5 rounded-md font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            BUSCAR DADOS
          </button>
          <div className="flex items-center gap-1">
            <Search className="h-3 w-3 text-secondary" />
            <Input 
              placeholder="Buscar..." 
              className="h-7 w-48 bg-white/10 border-none text-white placeholder:text-white/50 text-xs focus-visible:ring-1 focus-visible:ring-accent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="border-l border-white/20 pl-4">
            Analista: <strong>Rodrigo Silva</strong> | Data: {format(new Date(), 'dd/MM/yyyy')}
          </div>
        </div>
      </header>

      <main className="flex-1 p-5 flex flex-col gap-5 overflow-hidden">
        {/* Dashboard Panel */}
        <Card className="bg-white rounded-lg border border-border-custom shadow-none overflow-hidden">
          <CardHeader className="p-4 pb-2 border-none">
            <CardTitle className="text-[11px] font-bold uppercase text-text-light flex items-center gap-2 tracking-widest">
              <Calendar className="h-3 w-3" />
              Resumo Semanal Operacional
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 overflow-x-auto">
            <Table className="border-collapse text-[12px] table-fixed w-full">
              <TableHeader>
                <TableRow className="bg-[#f8f9fa] hover:bg-[#f8f9fa] border-none">
                  <TableHead className="w-40 font-bold text-text-dark border border-border-custom bg-[#f8f9fa]">Indicador</TableHead>
                  {dashboardData.map((day, i) => (
                    <TableHead key={i} className="text-center font-bold text-text-dark border border-border-custom">
                      {format(day.date, 'dd/MM')} {i === 0 && '(Hoje)'}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell className="font-bold text-text-dark border border-border-custom bg-[#f8f9fa]">Total do Dia</TableCell>
                  {dashboardData.map((day, i) => (
                    <TableCell key={i} className="text-center border border-border-custom font-bold text-accent">
                      {day.totalDia.toString().padStart(2, '0')}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell className="font-bold text-text-dark border border-border-custom bg-[#f8f9fa]">Total OK</TableCell>
                  {dashboardData.map((day, i) => (
                    <TableCell key={i} className="text-center border border-border-custom font-bold text-success">
                      {day.totalOk.toString().padStart(2, '0')}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell className="font-bold text-text-dark border border-border-custom bg-[#f8f9fa]">Pendente</TableCell>
                  {dashboardData.map((day, i) => (
                    <TableCell key={i} className="text-center border border-border-custom font-bold text-danger">
                      {day.pendente.toString().padStart(2, '0')}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Main Table */}
        <Card className="bg-white rounded-lg border border-border-custom shadow-none flex-1 flex flex-col overflow-hidden">
          <div className="p-4 bg-[#f8f9fa] border-b border-border-custom flex items-center justify-between shrink-0">
            <h3 className="text-sm font-bold text-text-dark flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent" />
              Amostras em Processamento
            </h3>
            <div className="text-[11px] text-text-light font-medium">
              Total: {filteredSamples.length} registros
            </div>
          </div>
          
          <div className="flex-1 overflow-auto relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center backdrop-blur-[1px]">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Sincronizando...</span>
                </div>
              </div>
            )}
            <Table className="text-[11px]">
              <TableHeader className="sticky top-0 z-10 bg-white">
                <TableRow className="hover:bg-transparent border-b-2 border-border-custom">
                  <TableHead className="font-bold uppercase text-[10px] text-text-light h-10">Cód.</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] text-text-light h-10">Análise</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] text-text-light h-10">Tipo</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] text-text-light h-10">ID Amostra</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] text-text-light h-10">Distribuição</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] text-text-light h-10">Entrega</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] text-text-light h-10">Deadline</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] text-text-light h-10">Recebimento</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] text-text-light h-10">Prazo</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] text-text-light h-10">Amostras Anal.</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] text-text-light h-10">Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSamples.map((sample, idx) => {
                  const dataLimite = parseISO(sample.dataLimite);
                  const dataDist = parseISO(sample.dataDistribuicao);
                  const dataEntrega = parseISO(sample.dataOrdemEntrega);

                  // Regra 1: Recebimento
                  const diffRecebimento = differenceInDays(dataLimite, dataDist);
                  const recebimentoStatus = diffRecebimento < 2 ? 'Chegou vencida' : 'OK';
                  const recebimentoClass = diffRecebimento < 2 ? 'bg-danger-light' : 'bg-success-light';

                  // Regra 2: Prazo
                  const diffPrazo = differenceInDays(dataEntrega, dataDist);
                  const prazoStatus = diffPrazo < 6 ? 'Rush' : 'Normal';
                  const prazoClass = diffPrazo < 6 ? 'bg-danger-light' : 'bg-success-light';

                  // Regra 3: Resultado
                  const resultadoStatus = sample.amostrasEmAnalise === sample.codigo ? 'OK' : 'Verificar';
                  const resultadoClass = sample.amostrasEmAnalise === sample.codigo 
                    ? 'bg-success-light' 
                    : sample.amostrasEmAnalise === '' ? 'bg-warning-light' : 'bg-danger-light';

                  return (
                    <TableRow key={idx} className="hover:bg-slate-50 border-b border-[#eee]">
                      <TableCell className="font-bold">{sample.codigo}</TableCell>
                      <TableCell className="text-text-light">{sample.metodoAnalise}</TableCell>
                      <TableCell className="text-text-light">{sample.tipoAmostra}</TableCell>
                      <TableCell className="font-medium">{sample.identificacaoAmostra}</TableCell>
                      <TableCell className="text-text-light">{format(dataDist, 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-text-light">{format(dataEntrega, 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-bold">{format(dataLimite, 'dd/MM/yyyy')}</TableCell>
                      
                      {/* Regra 1 */}
                      <TableCell>
                        <span className={`status-pill ${recebimentoClass}`}>
                          {recebimentoStatus}
                        </span>
                      </TableCell>

                      {/* Regra 2 */}
                      <TableCell>
                        <span className={`status-pill ${prazoClass}`}>
                          {prazoStatus}
                        </span>
                      </TableCell>

                      {/* Input User */}
                      <TableCell className="w-28">
                        <Input 
                          className="h-7 text-[11px] border-border-custom rounded-sm px-2"
                          value={sample.amostrasEmAnalise}
                          onChange={(e) => handleInputChange(idx, e.target.value)}
                          placeholder="Digitar..."
                        />
                      </TableCell>

                      {/* Regra 3 */}
                      <TableCell>
                        <span className={`status-pill ${resultadoClass}`}>
                          {resultadoStatus}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border-custom px-6 py-2 flex items-center justify-between text-[10px] text-text-light shrink-0">
        <div>Sincronizado com Google Sheets às {format(new Date(), 'HH:mm:ss')}</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-success" />
            Sistema Online
          </div>
          <div>Versão 2.4.0-STABLE | © 2024 Laboratory Solutions</div>
        </div>
      </footer>
    </div>
  );
}
