// Function to detect potential VPN usage
async function checkVPN() {
    try {
        // Get public IP and detailed geolocation information
        const response = await fetch('https://api.ipgeolocation.io/ipgeo?apiKey=YOUR_API_KEY');
        const data = await response.json();
        
        const vpnWarning = document.getElementById('vpn-warning');
        
        // Check if the IP belongs to a known VPN or proxy provider
        if (data.isp.includes('VPN') || data.isp.includes('Proxy') || data.security.is_vpn) {
            vpnWarning.style.display = 'block';
            return true;
        }

        // Ensure timezone matches the country from IP
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const browserCountry = timeZone.split('/')[1];

        if (data.country_name !== browserCountry) {
            vpnWarning.style.display = 'block';
            return true;
        }

        vpnWarning.style.display = 'none';
        return false;
    } catch (error) {
        console.error('Error checking VPN:', error);
        return false;
    }
}

async function checkVPNAndGetLocation() {
    const vpnDetected = await checkVPN();
    if (vpnDetected) {
        // Still allow getting location but with warning
        getLocation();
    } else {
        getLocation();
    }
}

function getLocation() {
    const statusDiv = document.getElementById('status');
    const addressDiv = document.getElementById('address');
    
    statusDiv.innerHTML = '<p class="loading">📍 Getting your location...</p>';
    addressDiv.innerHTML = '';

    if (!navigator.geolocation) {
        statusDiv.innerHTML = '<p class="error">⚠️ Geolocation is not supported by your browser</p>';
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        statusDiv.innerHTML = `
            <p style="text-align: center; font-weight: 600;">📍 Your coordinates:</p>
            <div class="coordinates">
                <div class="coordinate-box">
                    <div>Latitude</div>
                    <strong>${lat}</strong>
                </div>
                <div class="coordinate-box">
                    <div>Longitude</div>
                    <strong>${lon}</strong>
                </div>
            </div>
        `;

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
            );
            const data = await response.json();
            
            if (data.address) {
                const address = data.address;
                addressDiv.innerHTML = `
                    <p style="text-align: center; font-weight: 600; margin-bottom: 1rem;">📌 Your address:</p>
                    <div class="address-grid">
                        ${address.country ? `
                            <span class="address-label">Country:</span>
                            <span>${address.country}</span>
                        ` : ''}
                        
                        ${address.state ? `
                            <span class="address-label">State/Province:</span>
                            <span>${address.state}</span>
                        ` : ''}
                        
                        ${address.city || address.town || address.village ? `
                            <span class="address-label">City/Town:</span>
                            <span>${address.city || address.town || address.village}</span>
                        ` : ''}
                        
                        ${address.suburb ? `
                            <span class="address-label">Suburb:</span>
                            <span>${address.suburb}</span>
                        ` : ''}
                        
                        ${address.road ? `
                            <span class="address-label">Street:</span>
                            <span>${address.neighborhood || address.road}</span>
                        ` : ''}
                        
                        ${address.postcode ? `
                            <span class="address-label">Postal Code:</span>
                            <span>${address.postcode}</span>
                        ` : ''}
                    </div>
                `;
            } else {
                addressDiv.innerHTML = `
                    <p style="text-align: center; font-weight: 600;">📌 Full Address:</p>
                    <p style="text-align: center;">${data.display_name}</p>
                `;
            }
        } catch (error) {
            addressDiv.innerHTML = '<p class="error">⚠️ Error fetching address details</p>';
        }
    }, (error) => {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                statusDiv.innerHTML = '<p class="error">⚠️ Please allow location access to use this feature</p>';
                break;
            case error.POSITION_UNAVAILABLE:
                statusDiv.innerHTML = '<p class="error">⚠️ Location information unavailable</p>';
                break;
            case error.TIMEOUT:
                statusDiv.innerHTML = '<p class="error">⚠️ Location request timed out</p>';
                break;
            default:
                statusDiv.innerHTML = '<p class="error">⚠️ An unknown error occurred</p>';
                break;
        }
    });
}