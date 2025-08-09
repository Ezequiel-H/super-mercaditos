# Análisis de Supermercados - Organización de Informes

Este proyecto analiza la distribución y competencia de supermercados y tiendas, generando informes organizados en carpetas específicas.

## 📁 Estructura de Carpetas

```
supermercados/
├── data/                           # Datos de entrada
│   ├── disco.json
│   ├── jumbo.json
│   ├── dia.json
│   └── ...
├── outputs/                        # Resultados organizados
│   ├── distances/                  # Análisis de distancias para todas las tiendas
│   │   ├── all_shops_distances.json
│   │   └── all_shops_distances.csv
│   └── reports/                    # Informes en markdown
│       ├── RESUMEN_ESTRATEGICO_COMPETITIVO.md
│       └── INFORME_ANALISIS_DISTANCIAS.md
├── all_shops_distances.js
├── run_all_reports.js
└── package.json
```

## 🚀 Comandos Disponibles

### Ejecutar informes seleccionados
```bash
npm run reports
```
Este comando ejecuta el análisis de distancias y organiza los resultados en las carpetas correspondientes dentro de `outputs/`.

### Ejecutar análisis de distancias individual
```bash
npm run distances
```
Genera:
- `outputs/distances/all_shops_distances.json`
- `outputs/distances/all_shops_distances.csv`

## 📊 Tipos de Análisis

### Análisis de Distancias para Todas las Tiendas
- Calcula la distancia de cada tienda al supermercado más cercano
- Proporciona estadísticas de distribución de distancias
- Identifica patrones de ubicación
- Genera datos completos para análisis posteriores

## 📈 Informes Generados

### Archivos JSON
- Contienen datos completos con toda la información estructurada
- Ideales para análisis posteriores o integración con otros sistemas

### Archivos CSV
- Formato tabular para análisis en Excel, Google Sheets, etc.
- Fáciles de importar en herramientas de visualización

### Informes Markdown
- Resúmenes ejecutivos con análisis y recomendaciones
- Formato legible para presentaciones y documentación

## 🎯 Beneficios de la Organización

1. **Fácil navegación**: Cada tipo de análisis tiene su propia carpeta
2. **Escalabilidad**: Fácil agregar nuevos tipos de análisis
3. **Consistencia**: Todos los outputs siguen la misma estructura
4. **Automatización**: Un solo comando ejecuta todos los informes
5. **Trazabilidad**: Fácil identificar qué archivos corresponden a cada análisis

## 🔄 Flujo de Trabajo

1. Ejecutar `npm run reports` para generar el análisis de distancias
2. Revisar los resultados en las carpetas `outputs/`
3. Usar los archivos JSON para análisis adicionales
4. Importar los CSV en herramientas de visualización
5. Revisar los informes markdown para insights estratégicos 