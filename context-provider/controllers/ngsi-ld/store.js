//
// This controller is an example of accessing and amending the Context Data
// programmatically. The code uses a nodejs library to envelop all the
// necessary HTTP calls and responds with success or failure.
//

const debug = require('debug')('tutorial:ngsi-ld');
const monitor = require('../../lib/monitoring');
const ngsiLD = require('../../lib/ngsi-ld');
const _ = require('lodash');

debug('Store is retrieved using NGSI-LD');

const LinkHeader =
    '<https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json">';

function mapTileUrl(zoom, location) {
    const tilesPerRow = Math.pow(2, zoom);
    let longitude = location.coordinates[0];
    let latitude = location.coordinates[1];

    longitude /= 360;
    longitude += 0.5;
    latitude = 0.5 - Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360)) / Math.PI / 2.0;

    return (
        'https://a.tile.openstreetmap.org/' +
        zoom +
        '/' +
        Math.floor(longitude * tilesPerRow) +
        '/' +
        Math.floor(latitude * tilesPerRow) +
        '.png'
    );
}

// This function receives the details of a store from the context
//
// It is effectively processing the following cUrl command:
//   curl -X GET \
//     'http://{{orion}}/ngsi-ld/v1/entities/?type=Store&options=keyValues'
//
async function displayStore(req, res) {
    debug('displayStore');
    // If the user is not authorized, display the main page.
    if (!res.locals.authorized) {
        req.flash('error', 'Access Denied');
        return res.redirect('/');
    }
    try {
        monitor('NGSI', 'readEntity ' + req.params.storeId);
        const store = await ngsiLD.readEntity(
            req.params.storeId,
            { options: 'keyValues' },
            ngsiLD.setHeaders(req.session.access_token, LinkHeader)
        );
        // If a store has been found display it on screen
        store.mapUrl = mapTileUrl(15, store.location);
        return res.render('store', { title: store.name, store, ngsi: 'ngsi-ld' });
    } catch (error) {
        debug(error);
        // If no store has been found, display an error screen
        return res.render('store-error', {
            title: 'Error',
            error,
            ngsi: 'ngsi-ld'
        });
    }
}

// This function receives all products and a set of inventory items
//  from the context
//
// It is effectively processing the following cUrl commands:
//   curl -X GET \
//     'http://{{orion}}/ngsi-ld/v1/entities/?type=Product&options=keyValues'
//   curl -X GET \
//     'http://{{orion}}/ngsi-ld/v1/entities/?type=InventoryItem&options=keyValues&q=refStore==<entity-id>'
//
async function displayTillInfo(req, res) {
    debug('displayTillInfo');
    try {
        const stockedProducts = [];
        const inventory = [];
        const headers = ngsiLD.setHeaders(req.session.access_token, LinkHeader);

        monitor('NGSI', 'readEntity id=' + req.params.storeId);
        const building = await ngsiLD.readEntity(
            req.params.storeId,
            {
                options: 'keyValues',
                attrs: 'furniture'
            },
            headers
        );

        const furniture = Array.isArray(building.furniture) ? building.furniture : [building.furniture];

        monitor('NGSI', 'listEntities type=Shelf id=' + furniture.join(','));
        let productsList = await ngsiLD.listEntities(
            {
                type: 'Shelf',
                options: 'keyValues',
                attrs: 'stocks,numberOfItems',
                id: furniture.join(',')
            },
            headers
        );

        productsList = Array.isArray(productsList) ? productsList : [productsList];
        productsList = _.groupBy(productsList, (e) => {
            return e.stocks;
        });

        _.forEach(productsList, (value, key) => {
            stockedProducts.push(key);
            inventory.push({
                refProduct: key,
                shelfCount: _.reduce(
                    value,
                    function (sum, shelf) {
                        return sum + shelf.numberOfItems;
                    },
                    0
                )
            });
        });

        monitor('NGSI', 'listEntities type=Product id=' + stockedProducts.join(','));
        let productsInStore = await ngsiLD.listEntities(
            {
                type: 'Product',
                options: 'keyValues',
                attrs: 'name,price',
                id: stockedProducts.join(',')
            },
            headers
        );

        productsInStore = Array.isArray(productsInStore) ? productsInStore : [productsInStore];
        productsInStore = _.mapValues(productsInStore, (e) => {
            e.price = e.price * 100;
            return e;
        });

        return res.render('till', {
            products: productsInStore,
            inventory,
            ngsiLd: true,
            storeId: req.params.storeId
        });
    } catch (error) {
        debug(error);
        // An error occurred, return with no results
        return res.render('till', {
            products: {},
            inventory: {},
            ngsiLd: true,
            storeId: req.params.storeId
        });
    }
}

// This asynchronous function retrieves and updates an inventory item from the context
//
async function buyItem(req, res) {
    debug('buyItem');
    monitor('NGSI', 'listEntities ' + req.body.productId);

    const headers = ngsiLD.setHeaders(req.session.access_token, LinkHeader);
    const shelf = await ngsiLD.listEntities(
        {
            type: 'Shelf',
            options: 'keyValues',
            attrs: 'stocks,numberOfItems',
            q: 'numberOfItems>0;locatedIn=="' + req.body.storeId + '";stocks=="' + req.body.productId + '"',
            limit: 1
        },
        headers
    );

    const count = shelf[0].numberOfItems - 1;

    monitor('NGSI', 'updateAttribute ' + shelf[0].id, {
        numberOfItems: { type: 'Property', value: count }
    });
    await ngsiLD.updateAttribute(shelf[0].id, { numberOfItems: { type: 'Property', value: count } }, headers);
    res.redirect(`/app/store/${req.body.storeId}/till`);
}

// This function renders information for the warehouse of a store
// It is used to display alerts based on any low stock subscriptions received
//
function displayWarehouseInfo(req, res) {
    debug('displayWarehouseInfo');
    res.render('warehouse', { id: req.params.storeId });
}

function priceChange(req, res) {
    debug('priceChange');
    // If the user is not authorized, display the main page.
    if (!res.locals.authorized) {
        req.flash('error', 'Access Denied');
        return res.redirect('/');
    }
    // Render the price page (Managers only)
    return res.render('price-change', { title: 'Price Change' });
}

function orderStock(req, res) {
    debug('orderStock');
    // If the user is not authorized, display the main page.
    if (!res.locals.authorized) {
        req.flash('error', 'Access Denied');
        return res.redirect('/');
    }
    // Render the stock taking page (Managers only)
    return res.render('order-stock', { title: 'Order Stock' });
}

module.exports = {
    buyItem,
    displayStore,
    displayTillInfo,
    displayWarehouseInfo,
    priceChange,
    orderStock
};
