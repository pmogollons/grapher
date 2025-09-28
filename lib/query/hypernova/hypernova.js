import applyProps from '../lib/applyProps.js';
import prepareForDelivery from '../lib/prepareForDelivery.js';
import storeHypernovaResults from './storeHypernovaResults.js';

function hypernova(collectionNode, userId) {
    _.each(collectionNode.collectionNodes, childCollectionNode => {
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

        const stages = [
            { $search },
            { $match },
            {
                $project: {
                    ...fields,
                    searchScore: { $meta: 'searchScore' }
                }
            },
            { $limit: options2.limit },
            // Sort stage for a search is handled in the $search stage
          ];

        if (Object.keys($match).length === 0) {
            stages.splice(1, 1);
        }

        collectionNode.results = collection.aggregate(stages);
    } else {
        collectionNode.results = collection.find(filters, options, userId).fetch();
    }

    const userIdToPass = bypassFirewalls ? undefined : userId;
    hypernova(collectionNode, userIdToPass);

    prepareForDelivery(collectionNode, params);

    return collectionNode.results;
}
