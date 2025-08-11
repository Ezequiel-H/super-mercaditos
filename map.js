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
    
    // Set up event listeners for filter inputs
    document.getElementById('minOrders').addEventListener('input', updateFilters);
    document.getElementById('maxOrders').addEventListener('input', updateFilters);
    document.getElementById('lastOrderDate').addEventListener('input', updateFilters);
    
    // Load data
    loadData();
}

// Load all data
async function loadData() {
    try {
        // Load shops data
        const shopsResponse = await fetch('shops.json');
        shopsData = await shopsResponse.json();
        
        // Load supermarkets data from all chains
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
        
        for (const file of supermarketFiles) {
            try {
                const response = await fetch(file);
                const data = await response.json();
                supermarketsData = supermarketsData.concat(data);
            } catch (error) {
                console.warn(`Error loading ${file}:`, error);
            }
        }
        
        // Process and display data
        processShopsData();
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
        
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('loading').innerHTML = '<div style="color: red;">Error cargando datos</div>';
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
        
        // Apply order count filters
        const orders = parseInt(shop.pedidos_en_direccion) || 0;
        if (currentFilters.minOrders > 0 && orders < currentFilters.minOrders) {
            return false;
        }
        if (currentFilters.maxOrders && orders > currentFilters.maxOrders) {
            return false;
        }
        
        // Apply last order date filter
        if (currentFilters.lastOrderDate) {
            const lastOrder = shop.mes_ultima_orden;
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
        
        const popupContent = `
            <div style="min-width: 200px;">
                <h4 style="margin: 0 0 10px 0; color: #e74c3c;">🏪 Tienda Comunitaria</h4>
                <p><strong>Dirección:</strong> ${shop.delivery_address_main_line || 'No disponible'}</p>
                <p><strong>Pedidos en dirección:</strong> ${shop.pedidos_en_direccion || '0'}</p>
                <p><strong>Total pedidos líder:</strong> ${shop.total_pedidos_lider || '0'}</p>
                <p><strong>Última orden:</strong> ${shop.mes_ultima_orden || 'No disponible'}</p>
                <p><strong>ID:</strong> ${shop.community_leader_id || 'No disponible'}</p>
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
    const totalShopsCount = shopsData.filter(shop => 
        shop.delivery_address_latitude && 
        shop.delivery_address_longitude &&
        !isNaN(parseFloat(shop.delivery_address_latitude)) &&
        !isNaN(parseFloat(shop.delivery_address_longitude))
    ).length;
    
    const shopsCount = filteredShopsData.length;
    
    const supermarketsCount = supermarketsData.filter(supermarket => 
        supermarket.lat && 
        supermarket.lng &&
        !isNaN(parseFloat(supermarket.lat)) &&
        !isNaN(parseFloat(supermarket.lng))
    ).length;
    
    document.getElementById('totalShopsCount').textContent = totalShopsCount;
    document.getElementById('shopsCount').textContent = shopsCount;
    document.getElementById('supermarketsCount').textContent = supermarketsCount;
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
    const lastOrderDate = document.getElementById('lastOrderDate').value;
    
    currentFilters.minOrders = minOrders ? parseInt(minOrders) : 0;
    currentFilters.maxOrders = maxOrders ? parseInt(maxOrders) : null;
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
    document.getElementById('lastOrderDate').value = '';
    document.getElementById('distanceFilter').value = 'all';
    
    currentFilters = {
        minOrders: 0,
        maxOrders: null,
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