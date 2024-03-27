export default function applySoftDelete(collection, body, _params) {
  if (!body.$filters) {
    body.$filters = {};
  }

  if (collection._softDelete && body.$filters.isDeleted === undefined) {
    _.extend(body.$filters, {
      isDeleted: false
    })
  }
}
