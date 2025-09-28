import createGraph from './lib/createGraph.js';
import prepareForProcess from './lib/prepareForProcess.js';
import hypernova from './hypernova/hypernova.js';
import Base from './query.base';

export default class Query extends Base {
    /**
     * Retrieves the data.
     * @param context
     * @returns {*}
     */
    fetch(context = {}) {
        const node = createGraph(
            this.collection,
            prepareForProcess(this.collection, this.body, this.params)
        );

        return hypernova(node, context.userId, {params: this.params});
    }

    /**
     * @param context
     * @returns {*}
     */
    fetchOne(context = {}) {
        context.$options = context.$options || {};
        context.$options.limit = 1;
        return _.first(this.fetch(context));
    }

    /**
     * Gets the count of matching elements.
     * @returns {integer}
     */
    getCount() {
        const filters = this.body.$filters || {};

        if (filters.$search) {
            const { $search, ...$match } = filters;

            const stages = [
                { $searchMeta: { count: { type: "total" }, ...$search } },
                { $match: { ...$match } },
            ];

            if (Object.keys($match).length === 0) {
                stages.splice(1, 1);
            }

            return this.collection.aggregate(stages)[0]?.count?.total;
        }

        return this.collection.find(filters, {}).count();
    }
}
