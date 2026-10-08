/**
 * Escala de qualidade do ar baseada no US AQI (EPA), com rótulos e
 * recomendações em português.
 */
export interface AqiLevel {
  key: 'good' | 'moderate' | 'sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous'
  label: string
  min: number
  max: number
  color: string
  summary: string
  advice: { general: string; sensitive: string; activity: string; mask: string }
}

export const AQI_LEVELS: AqiLevel[] = [
  {
    key: 'good',
    label: 'Boa',
    min: 0,
    max: 50,
    color: '#3ddc97',
    summary: 'O ar está limpo. Aproveite as atividades ao ar livre.',
    advice: {
      general: 'Nenhuma restrição. Ótimo momento para abrir as janelas.',
      sensitive: 'Sem riscos relevantes para grupos sensíveis.',
      activity: 'Exercícios ao ar livre liberados.',
      mask: 'Máscara não é necessária.',
    },
  },
  {
    key: 'moderate',
    label: 'Moderada',
    min: 51,
    max: 100,
    color: '#f2d544',
    summary: 'Qualidade aceitável, com leve risco para pessoas muito sensíveis.',
    advice: {
      general: 'A maioria das pessoas pode manter a rotina normalmente.',
      sensitive: 'Pessoas com asma ou doenças cardíacas devem observar sintomas.',
      activity: 'Prefira exercícios intensos em horários de menor tráfego.',
      mask: 'Máscara opcional para pessoas muito sensíveis.',
    },
  },
  {
    key: 'sensitive',
    label: 'Ruim p/ sensíveis',
    min: 101,
    max: 150,
    color: '#ff9f43',
    summary: 'Grupos sensíveis podem sentir efeitos na saúde.',
    advice: {
      general: 'O público em geral provavelmente não será afetado.',
      sensitive: 'Crianças, idosos e pessoas com doenças respiratórias devem reduzir esforço ao ar livre.',
      activity: 'Reduza atividades intensas e prolongadas ao ar livre.',
      mask: 'Grupos sensíveis: considere máscara PFF2/N95.',
    },
  },
  {
    key: 'unhealthy',
    label: 'Ruim',
    min: 151,
    max: 200,
    color: '#ff5b5b',
    summary: 'Todos podem começar a sentir efeitos na saúde.',
    advice: {
      general: 'Evite ficar muito tempo ao ar livre. Mantenha janelas fechadas.',
      sensitive: 'Grupos sensíveis devem evitar qualquer esforço ao ar livre.',
      activity: 'Transfira exercícios para ambientes fechados.',
      mask: 'Use máscara PFF2/N95 ao sair.',
    },
  },
  {
    key: 'very-unhealthy',
    label: 'Muito ruim',
    min: 201,
    max: 300,
    color: '#b46cff',
    summary: 'Alerta de saúde: risco aumentado para toda a população.',
    advice: {
      general: 'Permaneça em ambientes fechados; use purificador se possível.',
      sensitive: 'Grupos sensíveis devem permanecer em casa.',
      activity: 'Suspenda atividades ao ar livre.',
      mask: 'PFF2/N95 obrigatória em qualquer saída.',
    },
  },
  {
    key: 'hazardous',
    label: 'Perigosa',
    min: 301,
    max: 500,
    color: '#e8336d',
    summary: 'Condição de emergência. Toda a população pode ser afetada.',
    advice: {
      general: 'Fique em casa com portas e janelas vedadas.',
      sensitive: 'Procure atendimento médico ao primeiro sintoma.',
      activity: 'Nenhuma atividade ao ar livre.',
      mask: 'PFF2/N95 obrigatória; evite qualquer saída.',
    },
  },
]

export const RISK_THRESHOLD = 101

export function levelFor(aqi: number | null | undefined): AqiLevel {
  if (aqi == null || Number.isNaN(aqi)) return AQI_LEVELS[0]
  return AQI_LEVELS.find((l) => aqi <= l.max) ?? AQI_LEVELS[AQI_LEVELS.length - 1]
}

export interface PollutantInfo {
  key: 'pm2_5' | 'pm10' | 'ozone' | 'nitrogen_dioxide' | 'sulphur_dioxide' | 'carbon_monoxide'
  name: string
  formula: string
  unit: string
  /** Valor-guia da OMS (2021) em μg/m³, usado como referência visual. */
  guideline: number
  description: string
}

export const POLLUTANTS: PollutantInfo[] = [
  { key: 'pm2_5', name: 'Partículas finas', formula: 'PM2.5', unit: 'μg/m³', guideline: 15, description: 'Penetram fundo nos pulmões e na corrente sanguínea.' },
  { key: 'pm10', name: 'Partículas inaláveis', formula: 'PM10', unit: 'μg/m³', guideline: 45, description: 'Poeira, pólen e fumaça que irritam as vias aéreas.' },
  { key: 'ozone', name: 'Ozônio', formula: 'O₃', unit: 'μg/m³', guideline: 100, description: 'Forma-se com sol e poluentes; agrava a asma.' },
  { key: 'nitrogen_dioxide', name: 'Dióxido de nitrogênio', formula: 'NO₂', unit: 'μg/m³', guideline: 25, description: 'Vem principalmente do tráfego de veículos.' },
  { key: 'sulphur_dioxide', name: 'Dióxido de enxofre', formula: 'SO₂', unit: 'μg/m³', guideline: 40, description: 'Emitido pela queima de combustíveis fósseis.' },
  { key: 'carbon_monoxide', name: 'Monóxido de carbono', formula: 'CO', unit: 'μg/m³', guideline: 4000, description: 'Gás incolor de combustão incompleta.' },
]

/** Cor para um poluente segundo a razão valor / valor-guia. */
export function ratioColor(ratio: number): string {
  if (ratio <= 0.5) return AQI_LEVELS[0].color
  if (ratio <= 1) return AQI_LEVELS[1].color
  if (ratio <= 2) return AQI_LEVELS[2].color
  if (ratio <= 3) return AQI_LEVELS[3].color
  return AQI_LEVELS[4].color
}
