/**
 * GOOGLE APPS SCRIPT - BACK-END (Code.gs)
 * 
 * Instruções:
 * 1. No seu Google Sheets, vá em Extensões > Apps Script.
 * 2. Apague tudo e cole este código.
 * 3. Crie um arquivo HTML chamado 'index' e cole o código do front-end.
 * 4. Clique em 'Implantar' > 'Nova Implantação' > 'App da Web'.
 */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Gestão de Amostras Lab')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Busca os dados da planilha 'DADOS _ LAB' no Google Drive.
 */
function getSheetData() {
  const files = DriveApp.getFilesByName('DADOS _ LAB');
  if (!files.hasNext()) {
    throw new Error('Planilha "DADOS _ LAB" não encontrada no Google Drive.');
  }
  
  const ss = SpreadsheetApp.open(files.next());
  const sheet = ss.getSheets()[0]; // Pega a primeira aba
  const data = sheet.getDataRange().getValues();
  
  // Remove o cabeçalho
  const rows = data.slice(1);
  
  return rows.map(row => ({
    codigo: row[0] ? row[0].toString() : '',
    metodoAnalise: row[1] ? row[1].toString() : '',
    tipoAmostra: row[2] ? row[2].toString() : '',
    identificacaoAmostra: row[3] ? row[3].toString() : '',
    dataDistribuicao: row[4] instanceof Date ? row[4].toISOString() : row[4],
    dataOrdemEntrega: row[5] instanceof Date ? row[5].toISOString() : row[5],
    dataLimite: row[6] instanceof Date ? row[6].toISOString() : row[6],
    recebimento: row[7] ? row[7].toString() : '',
    resultado: row[8] ? row[8].toString() : '',
    prazo: row[9] ? row[9].toString() : '',
    amostrasEmAnalise: row[10] ? row[10].toString() : ''
  }));
}

/**
 * Salva o valor da coluna 'Amostras em analises' na planilha 'DADOS _ LAB'.
 */
function updateAmostraAnalise(codigo, valor) {
  const files = DriveApp.getFilesByName('DADOS _ LAB');
  if (!files.hasNext()) return false;
  
  const ss = SpreadsheetApp.open(files.next());
  const sheet = ss.getSheets()[0];
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == codigo) {
      sheet.getRange(i + 1, 11).setValue(valor); // Coluna 11 (K)
      return true;
    }
  }
  return false;
}
