/**
 * Example keeper tick: GraphQL ping against bponder (mmm gql.mjs pattern).
 */
import { makeGql } from "../lib/gql.js"
import { logger } from "../utils/logger.js"

export class IndexerPingJob {
  private gql: ReturnType<typeof makeGql>

  constructor(baseUrl = process.env.INDEXER_URL || "http://127.0.0.1:42069") {
    this.gql = makeGql(baseUrl)
  }

  async execute() {
    try {
      const data = await this.gql(`{ __typename }`)
      logger.info(`Indexer GraphQL ok: ${JSON.stringify(data)}`)
    } catch (e) {
      logger.warn(
        `Indexer GraphQL ping failed: ${e instanceof Error ? e.message : e}`
      )
    }
  }
}
