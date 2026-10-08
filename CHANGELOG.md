# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2026-10-08

Primeira versão pública do AirViewer.

### Adicionado

- Detecção automática da localização do usuário, com fallback para São Paulo, e busca de cidades.
- Medidor do índice de qualidade do ar (US AQI) com categoria, resumo em português e índice UV; o fundo do painel assume a cor da qualidade do ar atual.
- Mapa de zonas de risco num raio de ~75 km, em modo suavizado ou grade.
- Agrupamento de áreas vizinhas com AQI ≥ 101 em zonas de risco, com pico, distância, direção e área; clicar numa zona centraliza o mapa nela.
- Gráfico com as últimas 24 h e a previsão de 3 dias, destacando o pico previsto.
- Poluentes (PM2.5, PM10, O₃, NO₂, SO₂, CO) comparados aos valores-guia da OMS (2021).
- Recomendações de saúde por categoria de qualidade do ar.
- Atualização automática a cada 15 minutos e layout responsivo.
