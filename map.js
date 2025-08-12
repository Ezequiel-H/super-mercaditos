// Global variables
let map;
let shopsLayer;
let supermarketsLayer;
let supermarketCirclesLayer;
let shopsData = [];
let supermarketsData = [];
let filteredShopsData = [];
let currentFilters = {
    minOrders: 0,
    maxOrders: null,
    minConfirmedOrders: 0,
    maxUnconfirmedOrders: null,
    minUniqueClients: 0,
    maxUniqueClients: null,
    minNewClients: 0,
    minNewClientsPct: 0,
    minAvgTicket: 0,
    maxAvgTicket: null,
    minAvgOrdersPerClient: 0,
    lastOrderDate: null,
    distanceFilter: 'all'
};
let supermarketCircles = [];

// Initialize the map
function initMap() {
    // Create map centered on Buenos Aires
    map = L.map('map').setView([-34.6037, -58.3816], 10);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Create layer groups for shops and supermarkets
    shopsLayer = L.layerGroup().addTo(map);
    supermarketsLayer = L.layerGroup().addTo(map);
    supermarketCirclesLayer = L.layerGroup().addTo(map);
    
    // Set up event listeners for checkboxes
    document.getElementById('showShops').addEventListener('change', toggleShops);
    document.getElementById('showSupermarkets').addEventListener('change', toggleSupermarkets);
    document.getElementById('showSupermarketCircles').addEventListener('change', toggleSupermarketCircles);
    
    // Set up event listeners for filters
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    document.getElementById('distanceFilter').addEventListener('change', updateDistanceFilter);
    
    // Set up event listeners for all filter inputs
    document.getElementById('minOrders').addEventListener('input', updateFilters);
    document.getElementById('maxOrders').addEventListener('input', updateFilters);
    document.getElementById('minConfirmedOrders').addEventListener('input', updateFilters);
    document.getElementById('maxUnconfirmedOrders').addEventListener('input', updateFilters);
    document.getElementById('minUniqueClients').addEventListener('input', updateFilters);
    document.getElementById('maxUniqueClients').addEventListener('input', updateFilters);
    document.getElementById('minNewClients').addEventListener('input', updateFilters);
    document.getElementById('minNewClientsPct').addEventListener('input', updateFilters);
    document.getElementById('minAvgTicket').addEventListener('input', updateFilters);
    document.getElementById('maxAvgTicket').addEventListener('input', updateFilters);
    document.getElementById('minAvgOrdersPerClient').addEventListener('input', updateFilters);
    document.getElementById('lastOrderDate').addEventListener('input', updateFilters);
    
    // Load data
    loadData();
}

// Load all data
async function loadData() {
    try {
        console.log('🚀 Iniciando carga de datos...');
        
        // Load shops data
        console.log('📊 Cargando datos de tiendas...');
        const shopsResponse = await fetch('shops.json');
        console.log('✅ Respuesta de tiendas recibida:', shopsResponse.status, shopsResponse.statusText);
        
        if (!shopsResponse.ok) {
            throw new Error(`Error HTTP: ${shopsResponse.status}`);
        }
        
        shopsData = await shopsResponse.json();
        console.log('✅ Datos de tiendas cargados:', shopsData.length, 'tiendas');
        
        // Load supermarkets data from all chains
        console.log('🛒 Cargando datos de supermercados...');
        const supermarketFiles = [
            'data/disco.json',
            'data/jumbo.json',
            'data/dia.json',
            'data/diarco.json',
            'data/vital.json',
            'data/maxiconsumo.json',
            'data/vea.json',
            'data/changomas.json',
            'data/carrefour.json',
            'data/coto.json'
        ];
        
        supermarketsData = [];
        for (const file of supermarketFiles) {
            try {
                console.log(`📁 Cargando ${file}...`);
                const response = await fetch(file);
                if (response.ok) {
                    const data = await response.json();
                    supermarketsData = supermarketsData.concat(data);
                    console.log(`✅ ${file} cargado:`, data.length, 'supermercados');
                } else {
                    console.warn(`⚠️ Error HTTP en ${file}:`, response.status);
                }
            } catch (error) {
                console.warn(`❌ Error cargando ${file}:`, error);
            }
        }
        
        console.log('✅ Total supermercados cargados:', supermarketsData.length);
        
        // Process and display data
        console.log('🔄 Procesando datos de tiendas...');
        processShopsData();
        
        console.log('🔄 Procesando datos de supermercados...');
        processSupermarketsData();
        
        // Initialize filtered data with all shops
        filteredShopsData = [...shopsData];
        
        // Update stats
        updateStats();
        
        // Update active filters indicator
        updateActiveFiltersIndicator();
        
        // Hide loading
        document.getElementById('loading').style.display = 'none';
        
        // Fit map to show all markers
        fitMapToMarkers();
        
        console.log('🎉 Carga de datos completada exitosamente!');
        
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        console.error('Stack trace:', error.stack);
        document.getElementById('loading').innerHTML = `
            <div style="color: red; text-align: center;">
                <h3>❌ Error cargando datos</h3>
                <p>${error.message}</p>
                <p>Revisa la consola del navegador para más detalles</p>
                <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">🔄 Recargar</button>
            </div>
        `;
    }
}

// Process shops data and add markers
function processShopsData() {
    shopsLayer.clearLayers();
    
    // Apply filters to shops data
    filteredShopsData = shopsData.filter(shop => {
        // Check if shop has valid coordinates
        if (!shop.delivery_address_latitude || !shop.delivery_address_longitude) {
            return false;
        }
        
        const lat = parseFloat(shop.delivery_address_latitude);
        const lng = parseFloat(shop.delivery_address_longitude);
        if (isNaN(lat) || isNaN(lng)) {
            return false;
        }
        
        // Calculate values for filtering
        const totalOrders = (parseInt(shop.pedidos_confirmados) || 0) + (parseInt(shop.pedidos_no_confirmados) || 0);
        const confirmedOrders = parseInt(shop.pedidos_confirmados) || 0;
        const unconfirmedOrders = parseInt(shop.pedidos_no_confirmados) || 0;
        const uniqueClients = parseInt(shop.clientes_unicos) || 0;
        const newClients = parseInt(shop.clientes_nuevos) || 0;
        const avgOrdersPerClient = parseFloat(shop.promedio_pedidos_por_cliente) || 0;
        const avgTicket = parseFloat(shop.ticket_promedio) || 0;
        const newClientsPercentage = parseFloat(shop.pct_clientes_nuevos) || 0;
        
        // Apply order count filters
        if (currentFilters.minOrders > 0 && totalOrders < currentFilters.minOrders) {
            return false;
        }
        if (currentFilters.maxOrders && totalOrders > currentFilters.maxOrders) {
            return false;
        }
        
        // Apply confirmed orders filters
        if (currentFilters.minConfirmedOrders > 0 && confirmedOrders < currentFilters.minConfirmedOrders) {
            return false;
        }
        
        // Apply unconfirmed orders filters
        if (currentFilters.maxUnconfirmedOrders && unconfirmedOrders > currentFilters.maxUnconfirmedOrders) {
            return false;
        }
        
        // Apply unique clients filters
        if (currentFilters.minUniqueClients > 0 && uniqueClients < currentFilters.minUniqueClients) {
            return false;
        }
        if (currentFilters.maxUniqueClients && uniqueClients > currentFilters.maxUniqueClients) {
            return false;
        }
        
        // Apply new clients filters
        if (currentFilters.minNewClients > 0 && newClients < currentFilters.minNewClients) {
            return false;
        }
        
        // Apply new clients percentage filter
        if (currentFilters.minNewClientsPct > 0 && newClientsPercentage < currentFilters.minNewClientsPct) {
            return false;
        }
        
        // Apply average ticket filters
        if (currentFilters.minAvgTicket > 0 && avgTicket < currentFilters.minAvgTicket) {
            return false;
        }
        if (currentFilters.maxAvgTicket && avgTicket > currentFilters.maxAvgTicket) {
            return false;
        }
        
        // Apply average orders per client filter
        if (currentFilters.minAvgOrdersPerClient > 0 && avgOrdersPerClient < currentFilters.minAvgOrdersPerClient) {
            return false;
        }
        
        // Apply last order date filter (if we have this data)
        if (currentFilters.lastOrderDate && shop.mes_ultima_compra) {
            const lastOrder = shop.mes_ultima_compra;
            if (lastOrder && lastOrder < currentFilters.lastOrderDate) {
                return false;
            }
        }
        
        // Apply distance filter
        if (currentFilters.distanceFilter !== 'all') {
            const isInside = isShopInsideSupermarketCircle(lat, lng);
            if (currentFilters.distanceFilter === 'inside' && !isInside) {
                return false;
            }
            if (currentFilters.distanceFilter === 'outside' && isInside) {
                return false;
            }
        }
        
        return true;
    });
    
    filteredShopsData.forEach(shop => {
        const lat = parseFloat(shop.delivery_address_latitude);
        const lng = parseFloat(shop.delivery_address_longitude);
        
        const marker = L.circleMarker([lat, lng], {
            radius: 6,
            fillColor: '#e74c3c',
            color: '#c0392b',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        });
        
        // Calculate total orders
        const totalOrders = (parseInt(shop.pedidos_confirmados) || 0) + (parseInt(shop.pedidos_no_confirmados) || 0);
        const confirmedOrders = parseInt(shop.pedidos_confirmados) || 0;
        const unconfirmedOrders = parseInt(shop.pedidos_no_confirmados) || 0;
        const uniqueClients = parseInt(shop.clientes_unicos) || 0;
        const newClients = parseInt(shop.clientes_nuevos) || 0;
        const avgOrdersPerClient = parseFloat(shop.promedio_pedidos_por_cliente) || 0;
        const avgTicket = parseFloat(shop.ticket_promedio) || 0;
        const newClientsPercentage = parseFloat(shop.pct_clientes_nuevos) || 0;
        
        const popupContent = `
            <div style="min-width: 300px; max-width: 400px;">
                <h4 style="margin: 0 0 15px 0; color: #e74c3c; border-bottom: 2px solid #e74c3c; padding-bottom: 5px;">🏪 Tienda Comunitaria</h4>
                
                <div style="margin-bottom: 15px;">
                    <p style="margin: 5px 0; font-weight: 600; color: #2c3e50;">📍 Dirección</p>
                    <p style="margin: 2px 0; color: #34495e;">${shop.delivery_address_main_line || 'No disponible'}</p>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <p style="margin: 5px 0; font-weight: 600; color: #2c3e50;">📊 Estadísticas de Pedidos</p>
                    <p style="margin: 2px 0; color: #34495e;"><strong>Total pedidos:</strong> ${totalOrders.toLocaleString()}</p>
                    <p style="margin: 2px 0; color: #34495e;"><strong>Pedidos confirmados:</strong> ${confirmedOrders.toLocaleString()}</p>
                    <p style="margin: 2px 0; color: #34495e;"><strong>Pedidos no confirmados:</strong> ${unconfirmedOrders.toLocaleString()}</p>
                    <p style="margin: 2px 0; color: #34495e;"><strong>Promedio por cliente:</strong> ${avgOrdersPerClient.toFixed(2)}</p>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <p style="margin: 5px 0; font-weight: 600; color: #2c3e50;">👥 Clientes</p>
                    <p style="margin: 2px 0; color: #34495e;"><strong>Clientes únicos:</strong> ${uniqueClients.toLocaleString()}</p>
                    <p style="margin: 2px 0; color: #34495e;"><strong>Clientes nuevos:</strong> ${newClients.toLocaleString()}</p>
                    <p style="margin: 2px 0; color: #34495e;"><strong>% Clientes nuevos:</strong> ${newClientsPercentage.toFixed(2)}%</p>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <p style="margin: 5px 0; font-weight: 600; color: #2c3e50;">💰 Financiero</p>
                    <p style="margin: 2px 0; color: #34495e;"><strong>Ticket promedio:</strong> $${avgTicket.toLocaleString('es-AR', {minimumFractionDigits: 2})}</p>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <p style="margin: 5px 0; font-weight: 600; color: #2c3e50;">🆔 Identificación</p>
                    <p style="margin: 2px 0; color: #34495e; font-family: monospace; font-size: 0.9em;">${shop.community_leader_id || 'No disponible'}</p>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        shopsLayer.addLayer(marker);
    });
    
    // Update stats after filtering
    updateStats();
}

// Process supermarkets data and add markers
function processSupermarketsData() {
    supermarketsLayer.clearLayers();
    supermarketCirclesLayer.clearLayers();
    supermarketCircles = [];
    
    supermarketsData.forEach(supermarket => {
        if (supermarket.lat && supermarket.lng) {
            const lat = parseFloat(supermarket.lat);
            const lng = parseFloat(supermarket.lng);
            
            if (!isNaN(lat) && !isNaN(lng)) {
                const marker = L.circleMarker([lat, lng], {
                    radius: 8,
                    fillColor: '#3498db',
                    color: '#2980b9',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                });
                
                const popupContent = `
                    <div style="min-width: 250px;">
                        <h4 style="margin: 0 0 10px 0; color: #3498db;">🛒 ${supermarket.retailer?.name || 'Supermercado'}</h4>
                        <p><strong>Dirección:</strong> ${supermarket.address || 'No disponible'}</p>
                        <p><strong>Ciudad:</strong> ${supermarket.city || 'No disponible'}</p>
                        <p><strong>Provincia:</strong> ${supermarket.province || 'No disponible'}</p>
                        <p><strong>Código Postal:</strong> ${supermarket.zip || 'No disponible'}</p>
                        ${supermarket.phone ? `<p><strong>Teléfono:</strong> ${supermarket.phone}</p>` : ''}
                        ${supermarket.store_hours && supermarket.store_hours.length > 0 ? 
                            `<p><strong>Horarios:</strong> ${formatStoreHours(supermarket.store_hours)}</p>` : ''}
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                supermarketsLayer.addLayer(marker);
                
                // Add 1km radius circle around supermarket
                const circle = L.circle([lat, lng], {
                    radius: 1000, // 1km in meters
                    color: '#3498db',
                    fillColor: '#3498db',
                    weight: 2,
                    opacity: 0.3,
                    fillOpacity: 0.1
                });
                
                // Store circle data for distance calculations
                supermarketCircles.push({
                    circle: circle,
                    center: [lat, lng],
                    radius: 1000
                });
                
                supermarketCirclesLayer.addLayer(circle);
            }
        }
    });
}

// Check if a shop is inside any supermarket circle
function isShopInsideSupermarketCircle(shopLat, shopLng) {
    if (supermarketCircles.length === 0) return false;
    
    for (const circleData of supermarketCircles) {
        const distance = map.distance([shopLat, shopLng], circleData.center);
        if (distance <= circleData.radius) {
            return true;
        }
    }
    return false;
}

// Format store hours for display
function formatStoreHours(hours) {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const formattedHours = hours.map(h => {
        const day = days[parseInt(h.dow) - 1] || h.dow;
        const open = h.open;
        const close = h.close;
        return `${day}: ${open}-${close}`;
    });
    return formattedHours.join(', ');
}

// Toggle shops visibility
function toggleShops() {
    const showShops = document.getElementById('showShops').checked;
    if (showShops) {
        map.addLayer(shopsLayer);
    } else {
        map.removeLayer(shopsLayer);
    }
}

// Toggle supermarkets visibility
function toggleSupermarkets() {
    const showSupermarkets = document.getElementById('showSupermarkets').checked;
    if (showSupermarkets) {
        map.addLayer(supermarketsLayer);
    } else {
        map.removeLayer(supermarketsLayer);
    }
}

// Toggle supermarket circles visibility
function toggleSupermarketCircles() {
    const showCircles = document.getElementById('showSupermarketCircles').checked;
    if (showCircles) {
        map.addLayer(supermarketCirclesLayer);
    } else {
        map.removeLayer(supermarketCirclesLayer);
    }
}

// Update distance filter
function updateDistanceFilter() {
    const distanceFilter = document.getElementById('distanceFilter').value;
    currentFilters.distanceFilter = distanceFilter;
    
    // Update active filters indicator
    updateActiveFiltersIndicator();
    
    // Reapply filters
    processShopsData();
    fitMapToMarkers();
}

// Update statistics
function updateStats() {
    const totalShops = shopsData.length;
    const filteredShops = filteredShopsData.length;
    const totalSupermarkets = supermarketsData.length;
    
    // Calculate additional statistics for filtered shops
    let totalOrders = 0;
    let totalConfirmedOrders = 0;
    let totalUnconfirmedOrders = 0;
    let totalUniqueClients = 0;
    let totalNewClients = 0;
    let totalRevenue = 0;
    let avgTicket = 0;
    let avgOrdersPerClient = 0;
    
    // New averages for filtered shops
    let avgConfirmedOrders = 0;
    let avgUnconfirmedOrders = 0;
    let avgNewClientsPct = 0;
    
    if (filteredShops > 0) {
        filteredShopsData.forEach(shop => {
            const orders = (parseInt(shop.pedidos_confirmados) || 0) + (parseInt(shop.pedidos_no_confirmados) || 0);
            const confirmed = parseInt(shop.pedidos_confirmados) || 0;
            const unconfirmed = parseInt(shop.pedidos_no_confirmados) || 0;
            const clients = parseInt(shop.clientes_unicos) || 0;
            const newClients = parseInt(shop.clientes_nuevos) || 0;
            const ticket = parseFloat(shop.ticket_promedio) || 0;
            const ordersPerClient = parseFloat(shop.promedio_pedidos_por_cliente) || 0;
            const newClientsPct = parseFloat(shop.pct_clientes_nuevos) || 0;
            
            totalOrders += orders;
            totalConfirmedOrders += confirmed;
            totalUnconfirmedOrders += unconfirmed;
            totalUniqueClients += clients;
            totalNewClients += newClients;
            totalRevenue += (ticket * orders);
            avgTicket += ticket;
            avgOrdersPerClient += ordersPerClient;
            avgConfirmedOrders += confirmed;
            avgUnconfirmedOrders += unconfirmed;
            avgNewClientsPct += newClientsPct;
        });
        
        // Calculate averages
        avgTicket = avgTicket / filteredShops;
        avgOrdersPerClient = avgOrdersPerClient / filteredShops;
        avgConfirmedOrders = avgConfirmedOrders / filteredShops;
        avgUnconfirmedOrders = avgUnconfirmedOrders / filteredShops;
        avgNewClientsPct = avgNewClientsPct / filteredShops;
    }
    
    // Update display - use the existing elements from HTML
    const shopsCountElement = document.getElementById('shopsCount');
    const totalShopsCountElement = document.getElementById('totalShopsCount');
    const supermarketsCountElement = document.getElementById('supermarketsCount');
    
    if (shopsCountElement) shopsCountElement.textContent = filteredShops;
    if (totalShopsCountElement) totalShopsCountElement.textContent = totalShops;
    if (supermarketsCountElement) supermarketsCountElement.textContent = totalSupermarkets;
    
    // Add additional stats display if we have filtered shops
    let statsHTML = `
        <span class="shops-count">Tiendas: ${filteredShops} / ${totalShops}</span>
        <span class="supermarkets-count">Supermercados: ${totalSupermarkets}</span>
    `;
    
    if (filteredShops > 0) {
        statsHTML += `
            <span style="color: #27ae60;">📊 Total pedidos: ${totalOrders.toLocaleString()}</span>
            <span style="color: #f39c12;">👥 Clientes únicos: ${totalUniqueClients.toLocaleString()}</span>
            <span style="color: #9b59b6;">💰 Ticket promedio: $${avgTicket.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
        `;
        
        // Add new average metrics
        statsHTML += `
            <span style="color: #e74c3c;">✅ Prom. pedidos confirmados: ${avgConfirmedOrders.toFixed(1)}</span>
            <span style="color: #f39c12;">❌ Prom. pedidos no confirmados: ${avgUnconfirmedOrders.toFixed(1)}</span>
            <span style="color: #9b59b6;">🆕 Prom. % clientes nuevos: ${avgNewClientsPct.toFixed(2)}%</span>
        `;
    }
    
    const statsElement = document.querySelector('.stats');
    if (statsElement) {
        statsElement.innerHTML = statsHTML;
    }
}

// Fit map to show all visible markers
function fitMapToMarkers() {
    const bounds = L.latLngBounds();
    
    // Add shops bounds if visible
    if (document.getElementById('showShops').checked) {
        filteredShopsData.forEach(shop => {
            if (shop.delivery_address_latitude && shop.delivery_address_longitude) {
                const lat = parseFloat(shop.delivery_address_latitude);
                const lng = parseFloat(shop.delivery_address_longitude);
                if (!isNaN(lat) && !isNaN(lng)) {
                    bounds.extend([lat, lng]);
                }
            }
        });
    }
    
    // Add supermarkets bounds if visible
    if (document.getElementById('showSupermarkets').checked) {
        supermarketsData.forEach(supermarket => {
            if (supermarket.lat && supermarket.lng) {
                const lat = parseFloat(supermarket.lat);
                const lng = parseFloat(supermarket.lng);
                if (!isNaN(lat) && !isNaN(lng)) {
                    bounds.extend([lat, lng]);
                }
            }
        });
    }
    
    // Add supermarket circles bounds if visible
    if (document.getElementById('showSupermarketCircles').checked) {
        supermarketCircles.forEach(circleData => {
            const [lat, lng] = circleData.center;
            const radius = circleData.radius / 111000; // Convert meters to approximate degrees
            
            bounds.extend([lat - radius, lng - radius]);
            bounds.extend([lat + radius, lng + radius]);
        });
    }
    
    // Fit map to bounds if we have any valid coordinates
    if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: [20, 20] });
    }
}

// Update filters from input values
function updateFilters() {
    const minOrders = document.getElementById('minOrders').value;
    const maxOrders = document.getElementById('maxOrders').value;
    const minConfirmedOrders = document.getElementById('minConfirmedOrders').value;
    const maxUnconfirmedOrders = document.getElementById('maxUnconfirmedOrders').value;
    const minUniqueClients = document.getElementById('minUniqueClients').value;
    const maxUniqueClients = document.getElementById('maxUniqueClients').value;
    const minNewClients = document.getElementById('minNewClients').value;
    const minNewClientsPct = document.getElementById('minNewClientsPct').value;
    const minAvgTicket = document.getElementById('minAvgTicket').value;
    const maxAvgTicket = document.getElementById('maxAvgTicket').value;
    const minAvgOrdersPerClient = document.getElementById('minAvgOrdersPerClient').value;
    const lastOrderDate = document.getElementById('lastOrderDate').value;
    
    currentFilters.minOrders = minOrders ? parseInt(minOrders) : 0;
    currentFilters.maxOrders = maxOrders ? parseInt(maxOrders) : null;
    currentFilters.minConfirmedOrders = minConfirmedOrders ? parseInt(minConfirmedOrders) : 0;
    currentFilters.maxUnconfirmedOrders = maxUnconfirmedOrders ? parseInt(maxUnconfirmedOrders) : null;
    currentFilters.minUniqueClients = minUniqueClients ? parseInt(minUniqueClients) : 0;
    currentFilters.maxUniqueClients = maxUniqueClients ? parseInt(maxUniqueClients) : null;
    currentFilters.minNewClients = minNewClients ? parseInt(minNewClients) : 0;
    currentFilters.minNewClientsPct = minNewClientsPct ? parseFloat(minNewClientsPct) : 0;
    currentFilters.minAvgTicket = minAvgTicket ? parseFloat(minAvgTicket) : 0;
    currentFilters.maxAvgTicket = maxAvgTicket ? parseFloat(maxAvgTicket) : null;
    currentFilters.minAvgOrdersPerClient = minAvgOrdersPerClient ? parseFloat(minAvgOrdersPerClient) : 0;
    currentFilters.lastOrderDate = lastOrderDate || null;
    
    // Update active filters indicator
    updateActiveFiltersIndicator();
}

// Update active filters indicator
function updateActiveFiltersIndicator() {
    const activeFiltersDiv = document.getElementById('activeFilters');
    const activeFiltersText = document.getElementById('activeFiltersText');
    
    const activeFilters = [];
    
    if (currentFilters.minOrders > 0) {
        activeFilters.push(`Mínimo ${currentFilters.minOrders} pedidos`);
    }
    if (currentFilters.maxOrders) {
        activeFilters.push(`Máximo ${currentFilters.maxOrders} pedidos`);
    }
    if (currentFilters.minConfirmedOrders > 0) {
        activeFilters.push(`Mínimo ${currentFilters.minConfirmedOrders} pedidos confirmados`);
    }
    if (currentFilters.maxUnconfirmedOrders) {
        activeFilters.push(`Máximo ${currentFilters.maxUnconfirmedOrders} pedidos no confirmados`);
    }
    if (currentFilters.minUniqueClients > 0) {
        activeFilters.push(`Mínimo ${currentFilters.minUniqueClients} clientes únicos`);
    }
    if (currentFilters.maxUniqueClients) {
        activeFilters.push(`Máximo ${currentFilters.maxUniqueClients} clientes únicos`);
    }
    if (currentFilters.minNewClients > 0) {
        activeFilters.push(`Mínimo ${currentFilters.minNewClients} clientes nuevos`);
    }
    if (currentFilters.minNewClientsPct > 0) {
        activeFilters.push(`Mínimo ${currentFilters.minNewClientsPct}% clientes nuevos`);
    }
    if (currentFilters.minAvgTicket > 0) {
        activeFilters.push(`Mínimo $${currentFilters.minAvgTicket.toLocaleString('es-AR', {minimumFractionDigits: 2})} ticket promedio`);
    }
    if (currentFilters.maxAvgTicket) {
        activeFilters.push(`Máximo $${currentFilters.maxAvgTicket.toLocaleString('es-AR', {minimumFractionDigits: 2})} ticket promedio`);
    }
    if (currentFilters.minAvgOrdersPerClient > 0) {
        activeFilters.push(`Mínimo ${currentFilters.minAvgOrdersPerClient.toFixed(2)} pedidos por cliente`);
    }
    if (currentFilters.lastOrderDate) {
        const date = new Date(currentFilters.lastOrderDate + '-01');
        const formattedDate = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
        activeFilters.push(`Desde ${formattedDate}`);
    }
    if (currentFilters.distanceFilter === 'inside') {
        activeFilters.push('Solo dentro de círculos de supermercados');
    } else if (currentFilters.distanceFilter === 'outside') {
        activeFilters.push('Solo fuera de círculos de supermercados');
    }
    
    if (activeFilters.length > 0) {
        activeFiltersText.textContent = activeFilters.join(', ');
        activeFiltersDiv.classList.add('show');
    } else {
        activeFiltersDiv.classList.remove('show');
    }
}

// Apply filters and refresh map
function applyFilters() {
    updateFilters();
    processShopsData();
    fitMapToMarkers();
}

// Clear all filters
function clearFilters() {
    document.getElementById('minOrders').value = '';
    document.getElementById('maxOrders').value = '';
    document.getElementById('minConfirmedOrders').value = '';
    document.getElementById('maxUnconfirmedOrders').value = '';
    document.getElementById('minUniqueClients').value = '';
    document.getElementById('maxUniqueClients').value = '';
    document.getElementById('minNewClients').value = '';
    document.getElementById('minNewClientsPct').value = '';
    document.getElementById('minAvgTicket').value = '';
    document.getElementById('maxAvgTicket').value = '';
    document.getElementById('minAvgOrdersPerClient').value = '';
    document.getElementById('lastOrderDate').value = '';
    document.getElementById('distanceFilter').value = 'all';
    
    currentFilters = {
        minOrders: 0,
        maxOrders: null,
        minConfirmedOrders: 0,
        maxUnconfirmedOrders: null,
        minUniqueClients: 0,
        maxUniqueClients: null,
        minNewClients: 0,
        minNewClientsPct: 0,
        minAvgTicket: 0,
        maxAvgTicket: null,
        minAvgOrdersPerClient: 0,
        lastOrderDate: null,
        distanceFilter: 'all'
    };
    
    // Hide active filters indicator
    document.getElementById('activeFilters').classList.remove('show');
    
    processShopsData();
    fitMapToMarkers();
}

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', initMap); 