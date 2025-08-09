# 🗺️ Mapa de Tiendas y Supermercados

Este proyecto incluye un mapa interactivo que muestra la ubicación de tiendas comunitarias y supermercados en Buenos Aires.

## 🚀 Cómo usar el mapa

### 1. Iniciar el servidor
```bash
npm run map
```

### 2. Abrir el navegador
Ve a `http://localhost:3000` en tu navegador web.

## ✨ Características del mapa

- **Tiendas comunitarias**: Marcadas con puntos rojos (🏪)
- **Supermercados**: Marcados con puntos azules (🛒)
- **Controles interactivos**: Checkboxes para mostrar/ocultar cada tipo de ubicación
- **Estadísticas en tiempo real**: Contador de tiendas y supermercados visibles
- **Información detallada**: Click en cualquier marcador para ver detalles
- **Responsive**: Funciona en dispositivos móviles y de escritorio

## 📊 Datos incluidos

### Tiendas comunitarias
- Ubicación geográfica (latitud/longitud)
- Dirección de entrega
- Número de pedidos
- ID del líder comunitario

### Supermercados
- Cadenas incluidas: Disco, Jumbo, Día, Diarco, Vital, Maxiconsumo, Vea, Changomas, Carrefour, Coto
- Ubicación geográfica
- Dirección completa
- Información de contacto
- Horarios de apertura

## 🛠️ Tecnologías utilizadas

- **Leaflet.js**: Biblioteca de mapas interactivos
- **OpenStreetMap**: Mapas base gratuitos
- **HTML5/CSS3**: Interfaz moderna y responsive
- **JavaScript ES6+**: Funcionalidad del mapa
- **Node.js**: Servidor local para desarrollo

## 📁 Estructura de archivos

```
├── map.html          # Página principal del mapa
├── map.js            # Lógica del mapa y manejo de datos
├── server.js         # Servidor local para desarrollo
├── shops.json        # Datos de tiendas comunitarias
├── data/             # Datos de supermercados por cadena
│   ├── disco.json
│   ├── jumbo.json
│   ├── dia.json
│   └── ...
└── README_MAP.md     # Este archivo
```

## 🔧 Personalización

### Cambiar colores de marcadores
Edita las variables en `map.js`:
- Tiendas: `#e74c3c` (rojo)
- Supermercados: `#3498db` (azul)

### Agregar nuevas cadenas
1. Agrega el archivo JSON en la carpeta `data/`
2. Incluye la ruta en el array `supermarketFiles` en `map.js`

### Modificar información de popups
Edita las funciones `processShopsData()` y `processSupermarketsData()` en `map.js`

## 🌐 Despliegue

Para usar en producción:
1. Sube todos los archivos a tu servidor web
2. Asegúrate de que el servidor soporte archivos estáticos
3. El mapa funcionará sin necesidad de Node.js en producción

## 📱 Compatibilidad

- ✅ Chrome, Firefox, Safari, Edge
- ✅ Dispositivos móviles (iOS, Android)
- ✅ Tablets
- ✅ Navegadores modernos con soporte ES6+

## 🆘 Solución de problemas

### El mapa no carga
- Verifica que el servidor esté corriendo en el puerto 3000
- Revisa la consola del navegador para errores
- Asegúrate de que todos los archivos JSON estén presentes

### Marcadores no aparecen
- Verifica que los archivos JSON tengan coordenadas válidas
- Revisa que los checkboxes estén marcados
- Comprueba que los datos tengan el formato correcto

### Rendimiento lento
- El mapa puede tardar en cargar con muchos marcadores
- Considera implementar clustering para mejorar el rendimiento
- Optimiza los archivos JSON si es necesario

## 📞 Soporte

Si tienes problemas o sugerencias, revisa:
1. La consola del navegador para errores
2. Los logs del servidor Node.js
3. La estructura de los archivos JSON 