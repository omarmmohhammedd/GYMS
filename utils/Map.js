
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const geocodingClient = mbxGeocoding({ accessToken: process.env.MAP_TOKEN })

exports.getPlace = async (lat, long) => {
    const response = await geocodingClient.reverseGeocode({
        query: [long, lat],
        types: ['address'],
        limit: 1
    }).send()
    const { features } = response.body;
    const { place_name } = features[0];
    if (!place_name) return next(new ApiError("Please Add Valid Lat And Long"))
    return place_name
}