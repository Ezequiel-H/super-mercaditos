// Global variables
let map;
let shopsLayer;
let supermarketsLayer;
let shopsData = [];
let supermarketsData = [];

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
    
    // Set up event listeners for checkboxes
    document.getElementById('showShops').addEventListener('change', toggleShops);
    document.getElementById('showSupermarkets').addEventListener('change', toggleSupermarkets);
    
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
        
        // Update stats
        updateStats();
        
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
    
    shopsData.forEach(shop => {
        if (shop.delivery_address_latitude && shop.delivery_address_longitude) {
            const lat = parseFloat(shop.delivery_address_latitude);
            const lng = parseFloat(shop.delivery_address_longitude);
            
            if (!isNaN(lat) && !isNaN(lng)) {
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
                        <p><strong>ID:</strong> ${shop.community_leader_id || 'No disponible'}</p>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                shopsLayer.addLayer(marker);
            }
        }
    });
}

// Process supermarkets data and add markers
function processSupermarketsData() {
    supermarketsLayer.clearLayers();
    
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
            }
        }
    });
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

// Update statistics
function updateStats() {
    const shopsCount = shopsData.filter(shop => 
        shop.delivery_address_latitude && 
        shop.delivery_address_longitude &&
        !isNaN(parseFloat(shop.delivery_address_latitude)) &&
        !isNaN(parseFloat(shop.delivery_address_longitude))
    ).length;
    
    const supermarketsCount = supermarketsData.filter(supermarket => 
        supermarket.lat && 
        supermarket.lng &&
        !isNaN(parseFloat(supermarket.lat)) &&
        !isNaN(parseFloat(supermarket.lng))
    ).length;
    
    document.getElementById('shopsCount').textContent = shopsCount;
    document.getElementById('supermarketsCount').textContent = supermarketsCount;
}

// Fit map to show all visible markers
function fitMapToMarkers() {
    const bounds = L.latLngBounds();
    
    // Add shops bounds if visible
    if (document.getElementById('showShops').checked) {
        shopsData.forEach(shop => {
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
    
    // Fit map to bounds if we have any valid coordinates
    if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: [20, 20] });
    }
}

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', initMap); 