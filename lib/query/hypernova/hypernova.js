import applyProps from '../lib/applyProps.js';
import prepareForDelivery from '../lib/prepareForDelivery.js';
import storeHypernovaResults from './storeHypernovaResults.js';

function hypernova(collectionNode, userId) {
    _.each(collectionNode.collectionNodes, childCollectionNode => {
        let {filters, options} = applyProps(childCollectionNode);

        storeHypernovaResults(childCollectionNode, userId);
        hypernova(childCollectionNode, userId);
    });
}

export default function hypernovaInit(collectionNode, userId, config = {}) {
    const bypassFirewalls = config.bypassFirewalls || false;
    const params = config.params || {};

    let {filters, options} = applyProps(collectionNode);

    const collection = collectionNode.collection;

    if (filters.$search) {
        const { $search, ...$match } = filters;
        const { fields, ...options2 } = options;
        delete fields.$search;

        collectionNode.results = collection.aggregate([
            { $search },
            { $match },
            {
                $project: {
                    ...fields,
                    searchScore: { $meta: 'searchScore' }
                }
            },
            {
                $sort: {
                    searchScore: -1,
                    ...options2.sort
                }
            },
            { $limit: options2.limit }
        ]);
    } else {
        collectionNode.results = collection.find(filters, options, userId).fetch();
    }

    const userIdToPass = (config.bypassFirewalls) ? undefined : userId;
    hypernova(collectionNode, userIdToPass);

    prepareForDelivery(collectionNode, params);

    return collectionNode.results;
}
