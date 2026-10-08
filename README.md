# AirViewer

Painel de qualidade do ar baseado na localização do usuário, com mapa de **zonas de risco** ao redor.

## Funcionalidades

- **Localização automática** via Geolocation API (com fallback para São Paulo) e **busca de cidades**.
- **Índice US AQI** atual em um medidor, com categoria e resumo em português. O fundo do painel muda de cor conforme a qualidade do ar.
- **Mapa de risco**: uma grade de 15×15 pontos (~0,1°, raio ≈ 75 km) é consultada em uma única requisição e pintada por categoria de AQI. Modo suavizado (heatmap) ou grade.
- **Zonas de risco**: células vizinhas com AQI ≥ 101 e mesmo nível são agrupadas em zonas contíguas, com pico, área aproximada, distância e direção. Clicar numa zona leva o mapa até ela.
- **Tendência**: últimas 24 h + previsão de 3 dias, com pico previsto.
- **Poluentes** (PM2.5, PM10, O₃, NO₂, SO₂, CO) comparados aos valores-guia da OMS (2021).
- **Recomendações de saúde** por categoria.
- Atualização automática a cada 15 minutos; layout responsivo.

## Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + build de produção em dist/
```

> A geolocalização do navegador só funciona em `localhost` ou HTTPS.

## Fontes de dados (sem chave de API)

| Dado | Fonte |
| --- | --- |
| Poluentes, AQI e previsão | [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) (Copernicus CAMS) |
| Busca de cidades | Open-Meteo Geocoding |
| Nome da localização atual | BigDataCloud reverse geocoding (client) |
| Mapa base | Esri World Dark Gray |

Os valores são estimativas de modelo (resolução ~10–40 km) e podem diferir de estações de monitoramento locais.

## Estrutura

```
src/
  lib/api.ts       # clientes das APIs
  lib/aqi.ts       # escala AQI, cores, poluentes e recomendações
  lib/zones.ts     # agrupamento da grade em zonas de risco
  lib/geo.ts       # distância e direção
  components/      # medidor, mapa, gráfico, cards
```
