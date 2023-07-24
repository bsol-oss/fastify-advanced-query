import _ from 'lodash'
import knex from 'knex'

const fastifyAdvanceQuery = async (
    host,
    user,
    password,
    database,
    table,
    query
) => {
    let DB = knex({
        client: 'mysql',
        connection: {
            host,
            user,
            password,
            database,
            dateStrings: ['DATETIME', 'DATE']
        }
    })

    let queryObj = DB.from(table)
    if (query.pagination) {
        const paginationObj = JSON.parse(query.pagination)
        const rows = paginationObj.rows || 100
        queryObj = queryObj.limit(rows).offset(paginationObj.offset)
    }

    if (query.sorting) {
        const sortingObj = JSON.parse(query.sorting)
        const sortField = sortingObj.field ? sortingObj.field.split(',') : null
        if (sortField)
            queryObj = queryObj.then((resp) => {
                return _.orderBy(
                    resp,
                    sortField,
                    sortingObj.sort ? sortingObj.sort.split(',') : 'asc'
                )
            })
    }

    if (query.where) {
        let whereQueries, result
        //For multiple "where" queries
        if (Array.isArray(query.where)) {
            whereQueries = query.where.map((q) => {
                return JSON.parse(q)
            })
        } else {
            whereQueries = [JSON.parse(query.where)]
        }

        //Array of queries containing "ops"
        const queryWithOps = whereQueries.filter((q) => {
            return q.ops
        })

        queryWithOps.forEach(async (q) => {
            let filterKey

            for (const key in q) {
                key != "ops" ? filterKey = key : null
            };

            queryObj = await queryObj.where(filterKey, q['ops'], q[filterKey])

        })

        let resp = await queryObj

        //Array without ops
        let sortingObj = _.difference(whereQueries, queryWithOps)

        let matches = []
        resp.forEach((res) => {
            //If all the queries match response
            //sortingObj in format : [{"name":"John"},{"id":5}]
            const match = sortingObj.every((q) => {
                return res[Object.keys(q)[0]]
                    .toString()
                    .toLowerCase()
                    .includes(q[Object.keys(q)[0]].toString().toLowerCase())
            })
            if (match) {
                matches.push(res)
            }
        })
        queryObj = matches
    }

    if (query.searching) {
        queryObj = queryObj.then((resp) => {
            let result = resp.filter((x) =>
                Object.values(x)
                    .slice(1)
                    .toString()
                    .toLowerCase()
                    .includes(query.searching.toLowerCase())
            )
            return result
        })
    }
    let result = await queryObj
    let count = await DB(table).count('id')
    return {
        count: count[0]['count(`id`)'],
        results: result
    }
}


export default fastifyAdvanceQuery
