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
        // TODO: We could use $sort in the $search stage when using a doc top
        //  field https://www.mongodb.com/docs/atlas/atlas-search/sort/
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
            {
                $sort: {
                    searchScore: -1,
                    ...options2.sort
                }
            },
            { $limit: options2.limit }
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
