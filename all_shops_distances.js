const fs = require('fs');
const path = require('path');

// Función para calcular la distancia entre dos puntos usando la fórmula de Haversine
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distancia en kilómetros
  return distance;
}

// Función para cargar todos los supermercados
function loadSupermarkets() {
  const dataDir = './data';
  const jsonFiles = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
  const supermarkets = [];

  jsonFiles.forEach(file => {
    try {
      const filePath = path.resolve(dataDir, file);
      const data = require(filePath);
      
      data.forEach(supermarket => {
        if (supermarket.lat && supermarket.lng) {
          supermarkets.push({
            id: supermarket.id,
            name: supermarket.retailer?.name || 'Unknown',
            address: supermarket.address,
            lat: parseFloat(supermarket.lat),
            lng: parseFloat(supermarket.lng),
            city: supermarket.city,
            province: supermarket.province
          });
        }
      });
    } catch (error) {
      console.log(`Error reading ${file}: ${error.message}`);
    }
  });

  return supermarkets;
}

// Función para cargar las tiendas
function loadShops() {
  try {
    const shopsData = require('./shops.json');
    return shopsData.map(shop => ({
      community_leader_id: shop.community_leader_id,
      delivery_main_line: shop.delivery_address_main_line,
      lat: parseFloat(shop.delivery_address_latitude),
      lng: parseFloat(shop.delivery_address_longitude),
      pedidos_en_direccion: parseInt(shop.pedidos_en_direccion) || 0,
      total_pedidos_lider: parseInt(shop.total_pedidos_lider) || 0
    })).filter(shop => !isNaN(shop.lat) && !isNaN(shop.lng));
  } catch (error) {
    console.log(`Error reading shops.json: ${error.message}`);
    return [];
  }
}

// Función principal
function main() {
  console.log('Cargando supermercados...');
  const supermarkets = loadSupermarkets();
  console.log(`Cargados ${supermarkets.length} supermercados`);

  console.log('Cargando tiendas...');
  const shops = loadShops();
  console.log(`Cargadas ${shops.length} tiendas`);

  console.log('Calculando distancias para todas las tiendas...');
  const allShopsWithDistances = [];

  shops.forEach((shop, index) => {
    if (index % 100 === 0) {
      console.log(`Procesando tienda ${index + 1} de ${shops.length}...`);
    }

    let nearestSupermarket = null;
    let minDistance = Infinity;

    supermarkets.forEach(supermarket => {
      const distance = calculateDistance(
        shop.lat, shop.lng,
        supermarket.lat, supermarket.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestSupermarket = supermarket;
      }
    });

    allShopsWithDistances.push({
      community_leader_id: shop.community_leader_id,
      shop_name: shop.community_leader_id, // Usar ID como nombre ya que no hay shop_name
      shop_address: shop.delivery_main_line,
      shop_lat: shop.lat,
      shop_lng: shop.lng,
      nearest_supermarket: nearestSupermarket,
      distance_km: minDistance,
      pedidos_en_direccion: shop.pedidos_en_direccion,
      total_pedidos_lider: shop.total_pedidos_lider
    });
  });

  // Ordenar por distancia (más cercana primero)
  allShopsWithDistances.sort((a, b) => a.distance_km - b.distance_km);

  // Guardar resultados en JSON
  const outputDir = './outputs/distances';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, 'all_shops_distances.json');
  fs.writeFileSync(outputFile, JSON.stringify(allShopsWithDistances, null, 2));

  // Generar CSV
  const headers = [
    'community_leader_id',
    'shop_name',
    'shop_address',
    'shop_lat',
    'shop_lng',
    'nearest_supermarket_id',
    'nearest_supermarket_name',
    'nearest_supermarket_address',
    'nearest_supermarket_lat',
    'nearest_supermarket_lng',
    'nearest_supermarket_city',
    'nearest_supermarket_province',
    'distance_km',
    'pedidos_en_direccion',
    'total_pedidos_lider'
  ];

  const csvLines = allShopsWithDistances.map(shop => [
    shop.community_leader_id,
    `"${shop.shop_name.replace(/"/g, '""')}"`,
    `"${shop.shop_address.replace(/"/g, '""')}"`,
    shop.shop_lat,
    shop.shop_lng,
    shop.nearest_supermarket.id,
    `"${shop.nearest_supermarket.name.replace(/"/g, '""')}"`,
    `"${shop.nearest_supermarket.address.replace(/"/g, '""')}"`,
    shop.nearest_supermarket.lat,
    shop.nearest_supermarket.lng,
    `"${shop.nearest_supermarket.city.replace(/"/g, '""')}"`,
    `"${shop.nearest_supermarket.province.replace(/"/g, '""')}"`,
    shop.distance_km.toFixed(3),
    shop.pedidos_en_direccion,
    shop.total_pedidos_lider
  ]);

  const csvContent = [headers.join(','), ...csvLines.map(line => line.join(','))].join('\n');
  fs.writeFileSync(path.join(outputDir, 'all_shops_distances.csv'), csvContent);

  console.log(`\n📊 RESULTADOS DEL ANÁLISIS DE DISTANCIAS`);
  console.log(`=======================================`);
  console.log(`Total de tiendas procesadas: ${shops.length}`);
  console.log(`Resultados guardados en:`);
  console.log(`- JSON: ${outputFile}`);
  console.log(`- CSV: ${path.join(outputDir, 'all_shops_distances.csv')}`);

  // Estadísticas
  const distances = allShopsWithDistances.map(shop => shop.distance_km);
  const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);

  console.log(`\n📈 ESTADÍSTICAS DE DISTANCIAS:`);
  console.log(`=============================`);
  console.log(`- Distancia mínima: ${minDistance.toFixed(3)}km`);
  console.log(`- Distancia máxima: ${maxDistance.toFixed(3)}km`);
  console.log(`- Distancia promedio: ${avgDistance.toFixed(3)}km`);

  // Distribución de distancias
  const closeShops = allShopsWithDistances.filter(shop => shop.distance_km <= 1).length;
  const mediumShops = allShopsWithDistances.filter(shop => shop.distance_km > 1 && shop.distance_km <= 5).length;
  const farShops = allShopsWithDistances.filter(shop => shop.distance_km > 5).length;

  console.log(`\n📊 DISTRIBUCIÓN DE DISTANCIAS:`);
  console.log(`=============================`);
  console.log(`- ≤1km: ${closeShops} tiendas (${((closeShops/shops.length)*100).toFixed(1)}%)`);
  console.log(`- 1-5km: ${mediumShops} tiendas (${((mediumShops/shops.length)*100).toFixed(1)}%)`);
  console.log(`- >5km: ${farShops} tiendas (${((farShops/shops.length)*100).toFixed(1)}%)`);

  // Estadísticas de pedidos
  const totalOrdersAtAddress = allShopsWithDistances.reduce((sum, shop) => sum + shop.pedidos_en_direccion, 0);
  const totalOrdersLeader = allShopsWithDistances.reduce((sum, shop) => sum + shop.total_pedidos_lider, 0);
  const avgOrdersAtAddress = totalOrdersAtAddress / shops.length;
  const avgOrdersLeader = totalOrdersLeader / shops.length;

  console.log(`\n📦 ESTADÍSTICAS DE PEDIDOS:`);
  console.log(`=============================`);
  console.log(`- Total pedidos en dirección: ${totalOrdersAtAddress.toLocaleString()}`);
  console.log(`- Total pedidos por líder: ${totalOrdersLeader.toLocaleString()}`);
  console.log(`- Promedio pedidos en dirección: ${avgOrdersAtAddress.toFixed(1)}`);
  console.log(`- Promedio pedidos por líder: ${avgOrdersLeader.toFixed(1)}`);

  // Distribución de pedidos
  const lowActivityShops = allShopsWithDistances.filter(shop => shop.pedidos_en_direccion <= 5).length;
  const mediumActivityShops = allShopsWithDistances.filter(shop => shop.pedidos_en_direccion > 5 && shop.pedidos_en_direccion <= 20).length;
  const highActivityShops = allShopsWithDistances.filter(shop => shop.pedidos_en_direccion > 20).length;

  console.log(`\n📊 DISTRIBUCIÓN DE ACTIVIDAD:`);
  console.log(`=============================`);
  console.log(`- ≤5 pedidos: ${lowActivityShops} tiendas (${((lowActivityShops/shops.length)*100).toFixed(1)}%)`);
  console.log(`- 6-20 pedidos: ${mediumActivityShops} tiendas (${((mediumActivityShops/shops.length)*100).toFixed(1)}%)`);
  console.log(`- >20 pedidos: ${highActivityShops} tiendas (${((highActivityShops/shops.length)*100).toFixed(1)}%)`);
}

// Ejecutar el análisis
if (require.main === module) {
  main();
}

module.exports = { calculateDistance }; 