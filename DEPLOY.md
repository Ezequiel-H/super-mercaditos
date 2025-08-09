# 🚀 Despliegue en Render

Este proyecto está configurado para funcionar como un **Static Site** en Render.

## 📋 Configuración en Render

### 1. Tipo de Servicio
- Selecciona **"Static Site"**

### 2. Configuración del Repositorio
- **Root Directory**: Dejar vacío (no configurar)
- **Build Command**: Dejar vacío (no configurar)
- **Publish Directory**: `public`

### 3. Variables de Entorno
- No se requieren variables de entorno para este sitio estático

## 🏗️ Estructura del Proyecto

```
/
├── public/                    # 📁 Directorio de publicación
│   ├── map.html             # 🗺️ Página principal del mapa
│   ├── map.js               # 📜 Lógica del mapa
│   └── (archivos estáticos)
├── data/                     # 📊 Datos de supermercados
│   ├── disco.json
│   ├── jumbo.json
│   ├── dia.json
│   └── ... (otros archivos)
├── shops.json               # 🏪 Datos de tiendas
└── README.md
```

## 🔄 Despliegue Automático

- Cada vez que hagas `git push` a tu repositorio, Render automáticamente:
  1. Detectará los cambios
  2. Desplegará la nueva versión
  3. Actualizará tu sitio

## 🌐 URL del Sitio

Después del despliegue, Render te proporcionará una URL como:
`https://tu-proyecto.onrender.com`

## ✅ Verificación

Para verificar que todo funciona:
1. El mapa debe cargar correctamente
2. Los marcadores de tiendas y supermercados deben aparecer
3. Los controles de filtrado deben funcionar
4. Las estadísticas deben mostrar el conteo correcto

## 🐛 Solución de Problemas

Si el mapa no carga:
- Verifica que todos los archivos JSON estén en la carpeta `data/`
- Revisa la consola del navegador para errores
- Asegúrate de que `shops.json` esté en la raíz del proyecto

## 📱 Características

- ✅ Mapa interactivo con Leaflet
- ✅ Marcadores para tiendas y supermercados
- ✅ Filtros por tipo de establecimiento
- ✅ Estadísticas en tiempo real
- ✅ Diseño responsive
- ✅ Carga asíncrona de datos 