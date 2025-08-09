# 🔍 Buscador de Duplicados de Community Leader ID

Este script analiza el archivo `shops.json` para encontrar duplicados del campo `community_leader_id` en la lista de shops.

## 📋 Características

- **Análisis completo**: Revisa todos los shops en busca de duplicados
- **Búsqueda específica**: Permite buscar un `community_leader_id` específico
- **Reporte detallado**: Muestra información completa de cada duplicado encontrado
- **Exportación de resultados**: Guarda los resultados en un archivo JSON
- **Estadísticas**: Proporciona resumen estadístico de los duplicados

## 🚀 Uso

### 1. Buscar todos los duplicados
```bash
node duplicate_finder.js
```

### 2. Buscar un ID específico
```bash
node duplicate_finder.js --search <community_leader_id>
```

### 3. Mostrar ayuda
```bash
node duplicate_finder.js --help
```

## 📊 Ejemplos de uso

### Buscar todos los duplicados:
```bash
node duplicate_finder.js
```

### Buscar un ID específico:
```bash
node duplicate_finder.js --search 00063ab48bf84478b2448ee115050f57
```

## 📁 Archivos generados

- **`duplicate_results.json`**: Archivo con todos los resultados del análisis
- **`duplicate_finder.js`**: Script principal del buscador

## 🔍 Información mostrada

Para cada duplicado encontrado, el script muestra:

- **Community Leader ID**: El ID duplicado
- **Cantidad de duplicados**: Cuántas veces aparece
- **Detalles de cada ubicación**:
  - Índice en el archivo
  - Dirección de entrega
  - Coordenadas (latitud/longitud)
  - Pedidos en dirección
  - Total de pedidos líder

## 📈 Estadísticas incluidas

- Total de shops analizados
- Total de community_leader_id únicos
- Total de community_leader_id con duplicados
- Máximo, mínimo y promedio de duplicados por ID

## ⚠️ Notas importantes

- El script requiere que exista el archivo `shops.json` en el directorio actual
- Los resultados se guardan automáticamente en `duplicate_results.json`
- El script maneja errores y muestra mensajes informativos

## 🛠️ Requisitos

- Node.js instalado
- Archivo `shops.json` presente en el directorio

## 📝 Estructura del archivo shops.json

El archivo debe contener un array de objetos con la siguiente estructura:
```json
[
  {
    "community_leader_id": "string",
    "delivery_address_main_line": "string",
    "delivery_address_latitude": "string",
    "delivery_address_longitude": "string",
    "pedidos_en_direccion": "string",
    "total_pedidos_lider": "string"
  }
]
``` 